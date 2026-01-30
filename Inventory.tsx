import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  quantity: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  low_stock_threshold: number;
  created_at: string;
}

const categories = ['Electronics', 'Clothing', 'Food', 'Office Supplies', 'Hardware', 'Other'];
const units = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'pack', 'dozen'];

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    quantity: 0,
    unit: 'pcs',
    purchase_price: 0,
    selling_price: 0,
    low_stock_threshold: 10,
  });

  useEffect(() => {
    if (user) {
      fetchInventory();
      subscribeToInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToInventory = () => {
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchInventory)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Item name is required', variant: 'destructive' });
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('inventory')
          .update({
            name: formData.name,
            sku: formData.sku || null,
            description: formData.description || null,
            category: formData.category || null,
            quantity: formData.quantity,
            unit: formData.unit,
            purchase_price: formData.purchase_price,
            selling_price: formData.selling_price,
            low_stock_threshold: formData.low_stock_threshold,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Item updated successfully' });
      } else {
        const { error } = await supabase.from('inventory').insert({
          user_id: user!.id,
          name: formData.name,
          sku: formData.sku || null,
          description: formData.description || null,
          category: formData.category || null,
          quantity: formData.quantity,
          unit: formData.unit,
          purchase_price: formData.purchase_price,
          selling_price: formData.selling_price,
          low_stock_threshold: formData.low_stock_threshold,
        });

        if (error) throw error;
        toast({ title: 'Success', description: 'Item added successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({ title: 'Error', description: 'Failed to save item', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      category: item.category || '',
      quantity: item.quantity,
      unit: item.unit,
      purchase_price: item.purchase_price,
      selling_price: item.selling_price,
      low_stock_threshold: item.low_stock_threshold,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      quantity: 0,
      unit: 'pcs',
      purchase_price: 0,
      selling_price: 0,
      low_stock_threshold: 10,
    });
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (item.quantity <= item.low_stock_threshold) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground">Manage your stock and products</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Item name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="SKU-001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Low Stock Alert</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price (₹)</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Selling Price (₹)</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Item description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary">
                    {editingItem ? 'Update' : 'Add'} Item
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
            placeholder="Search items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Inventory Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>{searchQuery ? 'No items found' : 'No items yet'}</p>
                <p className="text-sm">Add your first item to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Purchase</TableHead>
                    <TableHead className="text-right">Selling</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.sku || '-'}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "font-medium",
                            item.quantity <= item.low_stock_threshold && "text-warning"
                          )}>
                            {item.quantity} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.purchase_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.selling_price)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant === 'warning' ? 'secondary' : status.variant === 'success' ? 'default' : 'destructive'} className={cn(
                            status.variant === 'warning' && "bg-warning/10 text-warning border-warning/20",
                            status.variant === 'success' && "bg-success/10 text-success border-success/20"
                          )}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
