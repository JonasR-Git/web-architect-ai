'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, FileText, Trash2, Edit2, Plus, GripVertical, ChevronRight, ChevronDown, Merge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface SitemapNode {
    path: string;
    label: string;
    type: 'page' | 'layout';
    sources?: string[]; // List of original URLs consolidated here
}

interface MigrationEditorProps {
    plan: any;
    onUpdate: (newPlan: any) => void;
}

interface TreeNode {
    id: string; // path is unique id
    name: string;
    data: SitemapNode;
    children: TreeNode[];
    isOpen: boolean;
}

export function MigrationEditor({ plan, onUpdate }: MigrationEditorProps) {
    const [sitemap, setSitemap] = useState<SitemapNode[]>(plan.sitemap || []);
    const [editingNode, setEditingNode] = useState<SitemapNode | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Build hierarchical tree from flat sitemap paths
    const tree = useMemo(() => {
        const root: TreeNode = { id: 'root', name: 'Root', data: { path: '/', label: 'Home', type: 'page' }, children: [], isOpen: true };

        // Sort by depth so we build parents first
        const sorted = [...sitemap].sort((a, b) => a.path.split('/').length - b.path.split('/').length);

        sorted.forEach(node => {
            if (node.path === '/') return; // Skip root if manual

            const parts = node.path.split('/').filter(p => p);
            let current = root;

            // Navigate/Create path to parent
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                let child = current.children.find(c => c.name === part);
                if (!child) {
                    // Virtual parent if missing
                    const parentPath = '/' + parts.slice(0, i + 1).join('/');
                    child = {
                        id: parentPath,
                        name: part,
                        data: { path: parentPath, label: part, type: 'layout' },
                        children: [],
                        isOpen: true
                    };
                    current.children.push(child);
                }
                current = child;
            }

            // Add the actual node
            const name = parts[parts.length - 1];
            // Check if exists (might be created as virtual parent)
            let existing = current.children.find(c => c.name === name);
            if (existing) {
                existing.data = node; // Update virtual with real
            } else {
                current.children.push({
                    id: node.path,
                    name: name,
                    data: node,
                    children: [],
                    isOpen: true
                });
            }
        });

        return root;
    }, [sitemap]);

    const handleUpdateNode = (oldPath: string, newData: SitemapNode) => {
        // Update the sitemap array
        const newSitemap = sitemap.map(n => n.path === oldPath ? newData : n);

        // Also update children paths if root changed? (e.g. /about -> /company)
        // Complex logic: If I rename /about to /company, /about/team must become /company/team
        const updatedChildrenSitemap = newSitemap.map(n => {
            if (n.path.startsWith(oldPath + '/')) {
                return {
                    ...n,
                    path: n.path.replace(oldPath, newData.path)
                };
            }
            return n;
        });

        setSitemap(updatedChildrenSitemap);
        onUpdate({ ...plan, sitemap: updatedChildrenSitemap });
        setIsDialogOpen(false);
        setEditingNode(null);
    };

    const handleDelete = (path: string) => {
        const newSitemap = sitemap.filter(n => !n.path.startsWith(path)); // Delete recursive
        setSitemap(newSitemap);
        onUpdate({ ...plan, sitemap: newSitemap });
    };

    const handleAdd = () => {
        const newPath = '/new-page-' + Date.now();
        const newNode: SitemapNode = { path: newPath, label: 'New Page', type: 'page' };
        setSitemap([...sitemap, newNode]);
        setEditingNode(newNode);
        setIsDialogOpen(true);
    }

    // Recursive Tree Renderer
    const TreeNodeRow = ({ node, depth }: { node: TreeNode, depth: number }) => {
        const [collapsed, setCollapsed] = useState(false);
        const hasChildren = node.children.length > 0;

        return (
            <div>
                <div
                    className={cn(
                        "group flex items-center gap-2 py-2 px-3 hover:bg-white/5 rounded-lg mb-1 transition-colors border border-transparent hover:border-white/5",
                        editingNode?.path === node.data.path ? "bg-blue-500/20 border-blue-500/50" : ""
                    )}
                    style={{ marginLeft: depth * 20 }}
                >
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn("w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-gray-400", !hasChildren && "invisible")}
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {node.data.type === 'layout' ? <Folder size={16} className="text-yellow-400/80" /> : <FileText size={16} className="text-blue-400/80" />}

                    <div className="flex-1 text-sm">
                        <span className="text-gray-200 font-medium">{node.data.label}</span>
                        <span className="text-gray-600 ml-2 text-xs font-mono">{node.data.path}</span>
                        {node.data.sources && node.data.sources.length > 0 && (
                            <div className="ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300" title={`Consolidated from:\n${node.data.sources.join('\n')}`}>
                                <Merge size={10} />
                                <span>{node.data.sources.length} Merged</span>
                            </div>
                        )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-white"
                            onClick={() => { setEditingNode(node.data); setIsDialogOpen(true); }}
                        >
                            <Edit2 size={12} />
                        </Button>
                        <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDelete(node.data.path)}
                        >
                            <Trash2 size={12} />
                        </Button>
                    </div>
                </div>

                {!collapsed && node.children.map(child => (
                    <TreeNodeRow key={child.id} node={child} depth={depth + 1} />
                ))}
            </div>
        );
    };

    return (
        <Card className="bg-black/40 backdrop-blur border border-white/10 flex flex-col h-[600px]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div>
                    <h3 className="text-lg font-semibold text-white">Migration Editor</h3>
                    <p className="text-xs text-gray-400">Drag & Drop or Edit nodes to restructure V3 architecture.</p>
                </div>
                <Button size="sm" onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500">
                    <Plus size={14} className="mr-2" /> Add Page
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <TreeNodeRow node={tree} depth={0} />
            </ScrollArea>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Node</DialogTitle>
                    </DialogHeader>
                    {editingNode && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                    value={editingNode.label}
                                    onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Path (Route)</Label>
                                <Input
                                    value={editingNode.path}
                                    onChange={(e) => setEditingNode({ ...editingNode, path: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Changing this will move the node in the tree.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={editingNode.type}
                                    onValueChange={(v: any) => setEditingNode({ ...editingNode, type: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="page">Page</SelectItem>
                                        <SelectItem value="layout">Layout / Group</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => editingNode && handleUpdateNode(sitemap.find(n => n.path === editingNode.path || n.label === editingNode.label)?.path || editingNode.path, editingNode)}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
