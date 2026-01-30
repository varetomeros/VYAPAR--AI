import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Eye, Trash2, FileText, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  status: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customers?: { name: string } | null;
}

interface Customer {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  selling_price: number;
}

interface InvoiceLineItem {
  inventory_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function Invoices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: 18,
    discount_amount: 0,
    notes: '',
  });
  
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { inventory_id: null, description: '', quantity: 1, unit_price: 0, total_price: 0 }
  ]);

  useEffect(() => {
    if (user) {
      fetchData();
      subscribeToInvoices();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [invoicesRes, customersRes, inventoryRes] = await Promise.all([
        supabase.from('invoices').select('*, customers(name)').order('created_at', { ascending: false }),
        supabase.from('customers').select('id, name'),
        supabase.from('inventory').select('id, name, selling_price'),
      ]);

      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
      if (inventoryRes.data) setInventory(inventoryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToInvoices = () => {
    const channel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const prefix = 'INV';
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}${month}-${random}`;
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = (subtotal * formData.tax_rate) / 100;
    const total = subtotal + taxAmount - formData.discount_amount;
    return { subtotal, taxAmount, total };
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'inventory_id' && value) {
      const item = inventory.find(i => i.id === value);
      if (item) {
        newItems[index].description = item.name;
        newItems[index].unit_price = item.selling_price;
        newItems[index].total_price = item.selling_price * newItems[index].quantity;
      }
    }
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { inventory_id: null, description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = lineItems.filter(item => item.description && item.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: 'Error', description: 'Add at least one item', variant: 'destructive' });
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals();

    try {
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user!.id,
          invoice_number: generateInvoiceNumber(),
          customer_id: formData.customer_id || null,
          issue_date: formData.issue_date,
          due_date: formData.due_date || null,
          subtotal,
          tax_rate: formData.tax_rate,
          tax_amount: taxAmount,
          discount_amount: formData.discount_amount,
          total_amount: total,
          notes: formData.notes || null,
          status: 'draft',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const { error: itemsError } = await supabase.from('invoice_items').insert(
        validItems.map(item => ({
          invoice_id: invoice.id,
          inventory_id: item.inventory_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
      );

      if (itemsError) throw itemsError;

      toast({ title: 'Success', description: 'Invoice created successfully' });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
    }
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: `Invoice marked as ${status}` });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Invoice deleted successfully' });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tax_rate: 18,
      discount_amount: 0,
      notes: '',
    });
    setLineItems([{ inventory_id: null, description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success border-success/20';
      case 'sent': return 'bg-primary/10 text-primary border-primary/20';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">Create and manage your invoices</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Invoice Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select
                      value={formData.customer_id}
                      onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Issue Date</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {lineItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Select
                            value={item.inventory_id || ''}
                            onValueChange={(value) => updateLineItem(index, 'inventory_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventory.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            placeholder="Price"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-1 text-right font-medium">
                          {formatCurrency(item.total_price)}
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                            disabled={lineItems.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tax Rate</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="w-20"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Discount</span>
                      <Input
                        type="number"
                        min="0"
                        className="w-24"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <span className="text-destructive">-{formatCurrency(formData.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary">
                    Create Invoice
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>{searchQuery ? 'No invoices found' : 'No invoices yet'}</p>
                <p className="text-sm">Create your first invoice to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customers?.name || 'Walk-in Customer'}</TableCell>
                      <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell>{invoice.due_date ? formatDate(invoice.due_date) : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={cn("capitalize", getStatusColor(invoice.status))}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setViewingInvoice(invoice);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                            >
                              Send
                            </Button>
                          )}
                          {invoice.status === 'sent' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(invoice.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Invoice Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice {viewingInvoice?.invoice_number}</DialogTitle>
            </DialogHeader>
            {viewingInvoice && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{viewingInvoice.customers?.name || 'Walk-in Customer'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={cn("capitalize", getStatusColor(viewingInvoice.status))}>
                      {viewingInvoice.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Issue Date</p>
                    <p className="font-medium">{formatDate(viewingInvoice.issue_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{viewingInvoice.due_date ? formatDate(viewingInvoice.due_date) : 'Not set'}</p>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({viewingInvoice.tax_rate}%)</span>
                    <span>{formatCurrency(viewingInvoice.tax_amount)}</span>
                  </div>
                  {viewingInvoice.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-destructive">-{formatCurrency(viewingInvoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(viewingInvoice.total_amount)}</span>
                  </div>
                </div>
                {viewingInvoice.notes && (
                  <div>
                    <p className="text-muted-foreground text-sm">Notes</p>
                    <p className="text-sm">{viewingInvoice.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
