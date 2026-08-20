/**
 * Categories · 分类管理（系统预置只读 + 用户自定义 CRUD）
 * Premium Glassmorphism + Minimalism Redesign
 */
import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import { Modal } from '@/components/common/Modal';
import { Confirm } from '@/components/common/Confirm';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Empty } from '@/components/common/Empty';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { useUiStore } from '@/stores/uiStore';
import { getIcon, iconNames } from '@/lib/icons';
import type { CategoryRow } from '@/types/database';

const COLORS = ['#FF7A45', '#2F6BFF', '#FF8A3D', '#00C2A8', '#F53F3F', '#5B8CFF', '#9747FF', '#FF4D6A', '#00B96B', '#9AA0AB'];

export default function Categories() {
  const { current, canWrite } = useLedger();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('more-horizontal');
  const [color, setColor] = useState(COLORS[0]);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!current) return;
    void api.listCategories(current.id).then(setCategories).catch(() => setCategories([]));
  }, [current]);

  const roots = useMemo(
    () => categories.filter((c) => c.kind === kind && !c.parent_id).sort((a, b) => a.sort - b.sort),
    [categories, kind],
  );
  const customRoots = roots.filter((c) => c.ledger_id);

  const openNew = () => {
    setEditId(null);
    setName('');
    setIcon('more-horizontal');
    setColor(COLORS[0]);
    setModal(true);
  };

  const openEdit = (c: CategoryRow) => {
    setEditId(c.id);
    setName(c.name);
    setIcon(c.icon ?? 'more-horizontal');
    setColor(c.color ?? COLORS[0]);
    setModal(true);
  };

  const submit = async () => {
    if (!current) return;
    if (!name.trim()) {
      useUiStore.getState().showToast('warning', '请输入分类名称');
      return;
    }
    try {
      if (editId) {
        await api.saveCategory({ id: editId, ledger_id: current.id, name: name.trim(), icon, color });
        useUiStore.getState().showToast('success', '分类已更新');
      } else {
        await api.saveCategory({
          ledger_id: current.id,
          name: name.trim(),
          kind,
          icon,
          color,
          parent_id: null,
          sort: roots.length + 1,
        });
        useUiStore.getState().showToast('success', '分类已创建');
      }
      setModal(false);
      void api.listCategories(current.id).then(setCategories);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '保存失败');
    }
  };

  const remove = async (c: CategoryRow) => {
    if (!current) return;
    setRemoving(true);
    try {
      await api.deleteCategory(c.id);
      useUiStore.getState().showToast('success', '已删除');
      void api.listCategories(current.id).then(setCategories);
      setDeleting(null);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '删除失败');
      setDeleting(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="分类管理"
        right={
          canWrite ? (
            <button
              type="button"
              onClick={openNew}
              aria-label="新建分类"
              className="touch-target rounded-xl glass-sm text-primary transition-all duration-base hover:scale-105 active:scale-95"
            >
              <Plus size={22} aria-hidden />
            </button>
          ) : undefined
        }
      />

      {/* Kind Tabs - Glassmorphism */}
      <div className="glass-sm mb-4 inline-flex gap-1 p-1">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`min-h-[36px] rounded-lg px-5 text-caption font-medium transition-all duration-base ${
              kind === k
                ? 'glass-sm text-primary shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {k === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {roots.length === 0 ? (
        <Empty title="暂无分类" />
      ) : (
        <>
          {/* System Preset - Glassmorphism grid */}
          <section className="glass p-4 transition-all duration-base">
            <div className="overline-label mb-3 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary/60" />
              系统预置（全局共享）
            </div>
            <div className="grid grid-cols-5 gap-3">
              {roots.filter((c) => !c.ledger_id).map((c, idx) => (
                <div
                  key={c.id}
                  className="group flex flex-col items-center gap-2 rounded-xl p-2 transition-all duration-base hover:glass-sm hover:scale-105 active:scale-95"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-sm transition-all duration-base group-hover:scale-110">
                    <CategoryIcon name={c.icon} color={c.color} size={22} />
                  </div>
                  <span className="text-caption font-medium text-text-secondary group-hover:text-text">{c.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Custom Categories - Glassmorphism */}
          <section className="glass mt-4 overflow-hidden p-1 transition-all duration-base">
            <div className="overline-label px-3 pt-2 pb-1 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-secondary/60" />
              我的自定义
            </div>
            {customRoots.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-caption text-muted">暂无自定义分类，点击右上角 + 新建</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {customRoots.map((c) => (
                  <div
                    key={c.id}
                    className="group flex min-h-[56px] items-center gap-3 rounded-xl px-3 transition-all duration-base hover:glass-sm hover:scale-[1.01] active:scale-95"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm transition-all duration-base group-hover:scale-110">
                      <CategoryIcon name={c.icon} color={c.color} size={20} />
                    </div>
                    <span className="flex-1 text-body font-medium text-text-secondary group-hover:text-text">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      aria-label={`编辑 ${c.name}`}
                      className="touch-target rounded-lg glass-sm text-muted transition-all duration-base hover:text-primary hover:scale-105"
                    >
                      <Pencil size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(c)}
                      aria-label={`删除 ${c.name}`}
                      className="touch-target rounded-lg glass-sm text-muted transition-all duration-base hover:text-error hover:scale-105"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Modal - Glassmorphism */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? '编辑分类' : '新建分类'}>
        <div className="flex flex-col gap-4">
          <Input label="名称" name="name" placeholder="分类名称" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-caption font-medium text-text-secondary">图标</label>
            <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto">
              {iconNames.map((n) => {
                const Icon = getIcon(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIcon(n)}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-base ${
                      icon === n
                        ? 'glass-sm text-primary shadow-sm'
                        : 'glass-sm text-text-secondary opacity-60 hover:opacity-100'
                    }`}
                    aria-label={n}
                  >
                    <Icon size={20} aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-text-secondary">颜色</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-full transition-all duration-base hover:scale-110 active:scale-95 ${
                    color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <Button block onClick={submit}>
            保存
          </Button>
        </div>
      </Modal>

      {/* 删除分类确认弹窗 */}
      <Confirm
        open={deleting !== null}
        title="删除分类"
        description={`删除后不可恢复，确定删除「${deleting?.name ?? ''}」吗？`}
        confirmText="删除"
        tone="danger"
        loading={removing}
        onConfirm={() => {
          if (deleting) void remove(deleting);
        }}
        onCancel={() => {
          if (!removing) setDeleting(null);
        }}
      />
    </div>
  );
}
