"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createCategory,
  createCategoryRule,
  deleteCategory,
  deleteCategoryRule,
  getCategories,
  getCategoryRules,
} from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import type { Category, CategoryKind, CategoryRule } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [creating, setCreating] = useState(false);

  // Chaîne vide (jamais undefined/null) pour que le Select reste contrôlé
  // dès le premier rendu — Base UI avertit si un composant passe de
  // non-contrôlé à contrôlé une fois les catégories chargées.
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [rules, setRules] = useState<CategoryRule[] | null>(null);
  const [keyword, setKeyword] = useState("");
  const [addingRule, setAddingRule] = useState(false);

  function loadCategories() {
    getCategories()
      .then((cats) => {
        setCategories(cats);
        setSelectedCategoryId((prev) => prev || (cats.length > 0 ? cats[0].id : ""));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }

  useEffect(loadCategories, []);

  useEffect(() => {
    if (!selectedCategoryId) return;
    // Garde la liste précédente affichée pendant le chargement des règles
    // de la nouvelle catégorie sélectionnée, plutôt que de la vider.
    getCategoryRules(selectedCategoryId)
      .then(setRules)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }, [selectedCategoryId]);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const category = await createCategory({ name, kind });
      setCategories((prev) => (prev ? [...prev, category] : [category]));
      setName("");
      toast.success(`Catégorie "${category.name}" créée.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    setError(null);
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev?.filter((c) => c.id !== category.id) ?? prev);
      if (selectedCategoryId === category.id) setSelectedCategoryId("");
      toast.success(`Catégorie "${category.name}" supprimée.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategoryId || keyword.trim().length < 2) return;
    setError(null);
    setAddingRule(true);
    try {
      const rule = await createCategoryRule(selectedCategoryId, keyword.trim());
      setRules((prev) => (prev ? [...prev, rule] : [rule]));
      setKeyword("");
      toast.success("Règle ajoutée.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setAddingRule(false);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    setError(null);
    try {
      await deleteCategoryRule(ruleId);
      setRules((prev) => prev?.filter((r) => r.id !== ruleId) ?? prev);
      toast.success("Règle supprimée.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    }
  }

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle catégorie</CardTitle>
          <CardDescription>
            Les catégories par défaut ne peuvent pas être supprimées, seules les tiennes le
            peuvent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateCategory}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="category-name">Nom</Label>
              <Input
                id="category-name"
                placeholder="Cadeaux"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind((v as CategoryKind) ?? "expense")}>
                <SelectTrigger className="w-40">
                  <SelectValue>
                    {(value: unknown) => (value === "income" ? "Revenu" : "Dépense")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Dépense</SelectItem>
                  <SelectItem value="income">Revenu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catégories</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {categories?.map((category) => (
            <div key={category.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span>{category.name}</span>
                <Badge variant={category.kind === "income" ? "secondary" : "outline"}>
                  {category.kind === "income" ? "Revenu" : "Dépense"}
                </Badge>
              </div>
              {category.userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(category)}
                >
                  Supprimer
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Règles de catégorisation automatique</CardTitle>
          <CardDescription>
            Un mot-clé (comparé au libellé de la transaction) qui assigne automatiquement cette
            catégorie lors d&apos;un import.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Catégorie</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(v) => setSelectedCategoryId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() => selectedCategory?.name ?? "Choisir une catégorie"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleAddRule} className="flex items-end gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="keyword">Mot-clé</Label>
              <Input
                id="keyword"
                placeholder="NETFLIX"
                minLength={2}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={addingRule || !selectedCategoryId}>
              {addingRule ? "Ajout..." : "Ajouter"}
            </Button>
          </form>

          <div className="flex flex-col gap-2">
            {rules === null && (
              <p className="text-sm text-muted-foreground">Chargement des règles...</p>
            )}
            {rules !== null && rules.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune règle pour cette catégorie.</p>
            )}
            {rules?.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between text-sm">
                <span className="font-mono">{rule.keyword}</span>
                <div className="flex items-center gap-2">
                  {rule.userId === null && <Badge variant="outline">Système</Badge>}
                  {rule.userId !== null && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
