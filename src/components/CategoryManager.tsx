// Kategorien anlegen, umbenennen, einfärben und löschen (für Finanzen und Zeit).
import { useState } from 'react';
import { PALETTE } from '../lib/defaults';
import { uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { Category } from '../lib/types';
import { Icon } from './Icon';
import { Dot, Modal } from './ui';

export function CategoryManager({ col, isUsed }: {
  col: 'finCategories' | 'timeCategories';
  isUsed: (id: string) => boolean;
}) {
  const { data, save, remove } = useStore();
  const [edit, setEdit] = useState<Category | null>(null);
  const cats = data[col];

  const add = () => setEdit({ id: uid(), name: '', color: PALETTE[cats.length % PALETTE.length] });

  return (
    <details className="card">
      <summary>Kategorien ({cats.length})</summary>
      <ul className="list">
        {cats.map((c) => (
          <li key={c.id} className="clickable" onClick={() => setEdit(c)}>
            <Dot color={c.color} />
            <span className="grow title">{c.name}</span>
            <Icon name="edit" size={16} />
          </li>
        ))}
      </ul>
      <button className="btn small" onClick={add}><Icon name="plus" size={16} /> Neue Kategorie</button>
      {edit && (
        <CategoryForm
          value={edit}
          isNew={!cats.some((c) => c.id === edit.id)}
          onClose={() => setEdit(null)}
          onSave={(c) => {
            save(col, c);
            setEdit(null);
          }}
          onDelete={() => {
            if (isUsed(edit.id)) return alert('Diese Kategorie wird noch verwendet. Ändere zuerst die zugehörigen Einträge.');
            if (confirm(`Kategorie „${edit.name}“ löschen?`)) {
              remove(col, edit.id);
              setEdit(null);
            }
          }}
        />
      )}
    </details>
  );
}

function CategoryForm({ value, isNew, onClose, onSave, onDelete }: {
  value: Category;
  isNew: boolean;
  onClose: () => void;
  onSave: (c: Category) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(value.name);
  const [color, setColor] = useState(value.color);
  return (
    <Modal title={isNew ? 'Neue Kategorie' : 'Kategorie bearbeiten'} onClose={onClose}>
      <form className="form" onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave({ ...value, name: name.trim(), color });
      }}>
        <div className="row">
          <label style={{ flex: 1 }}>Name<input value={name} onChange={(e) => setName(e.target.value)} autoFocus required /></label>
          <label>Farbe<input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        </div>
        <div className="row">
          {PALETTE.map((p) => (
            <button type="button" key={p} className="swatch" style={{ background: p }} aria-label={p} onClick={() => setColor(p)} />
          ))}
        </div>
        <div className="row end">
          {!isNew && <button type="button" className="btn danger" onClick={onDelete}>Löschen</button>}
          <button className="btn primary">Speichern</button>
        </div>
      </form>
    </Modal>
  );
}
