import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import { MarkdownManager } from "@tiptap/markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Code2,
  Eye,
  FileAudio,
  Heart,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Plus,
  Quote,
  Share2,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  Video,
  PanelsTopLeft,
} from "lucide-react";
import { toast } from "sonner";
import { adminArticlesApi, idOf, pageData } from "../api/articles";
import { articleExtensions, parseContent } from "../blog/ArticleContent";
import { MediaEmbed, mediaDirectivesForMarkdown, parseMediaDirectiveChildren, safeEmbedUrl, safeMediaUrl, vimeoUrl, youtubeUrl } from "../blog/multimedia";
import MediaPicker, { MediaLibrary } from "./MediaPicker";
import { resolveMediaUrl } from "../api/client";

let markdownManager;

function getMarkdownManager() {
  // Markdown conversion is only needed after opening the editor's Markdown tab.
  // Do not initialize Tiptap's manager while the lazy AdminBlog module loads.
  markdownManager ??= new MarkdownManager({ extensions: articleExtensions });
  return markdownManager;
}

const toMarkdown = (content) => getMarkdownManager().serialize(mediaDirectivesForMarkdown(parseContent(content)));
const fromMarkdown = (content) => parseContent(getMarkdownManager().parse(content));

const schema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(180),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones")
    .max(200),
  excerpt: z.string().max(600).optional(),
  content: z.any(),
  status: z.enum(["draft", "published", "scheduled"]),
  scheduledAt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()),
  featured: z.boolean(),
  coverImage: z.string().optional(),
  useCoverAsThumbnail: z.boolean(),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
  seoKeywords: z.string().optional(),
});
const field =
  "mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--fg)]";
const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const label = (item) =>
  typeof item === "string" ? item : item?.name || item?.title || "";
const error = (value) => {
  const message =
    value?.response?.data?.error?.message ||
    value?.response?.data?.message ||
    value?.message;
  return Array.isArray(message)
    ? message.join(". ")
    : message || "No fue posible completar la operación.";
};

function MetricSummary({ item, className = "" }) {
  const metrics = item?.metrics;
  if (!metrics) return null;
  const sharesByNetwork = Object.entries(metrics.sharesByNetwork || {}).filter(
    ([, total]) => total,
  );

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--fg-faint)] ${className}`}
    >
      <span className="inline-flex items-center gap-1" title="Vistas">
        <Eye size={13} /> {metrics.views || 0}
      </span>
      <span className="inline-flex items-center gap-1" title="Likes">
        <Heart size={13} /> {metrics.likes || 0}
      </span>
      <span className="inline-flex items-center gap-1" title="Compartidos">
        <Share2 size={13} /> {metrics.shares || 0}
      </span>
      {sharesByNetwork.length > 0 && (
        <span className="basis-full">
          Compartidos: {sharesByNetwork.map(([network, total]) => `${network} ${total}`).join(" · ")}
        </span>
      )}
    </div>
  );
}

function Toolbar({ editor, onOpenMedia }) {
  if (!editor) return null;
  const button = (action, Icon, title, active = false) => (
    <button
      type="button"
      title={title}
      onClick={action}
      className={`rounded p-1.5 ${active ? "bg-[var(--bg-soft)] text-[var(--fg)]" : "text-[var(--fg-muted)] hover:bg-[var(--bg-soft)]"}`}
    >
      <Icon size={16} />
    </button>
  );
  const setLink = () => {
    const href = window.prompt("URL del enlace");
    if (href)
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };
  const setImage = () => {
    const src = window.prompt("URL de la imagen");
    if (src) editor.chain().focus().setImage({ src }).run();
  };
  const setEmbed = (kind) => {
    const value = window.prompt(`URL de ${kind === "youtube" ? "YouTube" : kind === "vimeo" ? "Vimeo" : "embed permitido"}`);
    const src = ({ youtube: youtubeUrl, vimeo: vimeoUrl, embed: safeEmbedUrl })[kind](value || "");
    if (!src) return value && toast.error("La URL no es válida o no pertenece a un proveedor permitido.");
    const command = kind === "youtube" ? "setYoutubeVideo" : kind === "vimeo" ? "setVimeo" : "setSafeEmbed";
    editor.chain().focus()[command]({ src }).run();
  };
  return (
    <div className="flex flex-wrap gap-1 border-b border-[var(--border)] p-2">
      {button(
        () => editor.chain().focus().toggleBold().run(),
        Bold,
        "Negrita",
        editor.isActive("bold"),
      )}
      {button(
        () => editor.chain().focus().toggleItalic().run(),
        Italic,
        "Cursiva",
        editor.isActive("italic"),
      )}
      {button(
        () => editor.chain().focus().toggleUnderline().run(),
        UnderlineIcon,
        "Subrayado",
        editor.isActive("underline"),
      )}
      {button(setLink, Link2, "Enlace", editor.isActive("link"))}
      {button(setImage, ImagePlus, "Imagen por URL")}
      {button(() => onOpenMedia("image"), ImagePlus, "Imagen desde medios")}
      {button(() => onOpenMedia("video"), Video, "Vídeo local desde medios")}
      {button(() => onOpenMedia("audio"), FileAudio, "Audio desde medios")}
      {button(() => { const src = safeMediaUrl(window.prompt("URL del vídeo local") || ""); if (src) editor.chain().focus().setLocalVideo({ src }).run(); }, Video, "Vídeo local por URL")}
      {button(() => { const src = safeMediaUrl(window.prompt("URL del audio") || ""); if (src) editor.chain().focus().setAudio({ src }).run(); }, FileAudio, "Audio por URL")}
      {button(() => setEmbed("youtube"), PanelsTopLeft, "Insertar YouTube")}
      {button(() => setEmbed("vimeo"), PanelsTopLeft, "Insertar Vimeo")}
      {button(() => setEmbed("embed"), PanelsTopLeft, "Embed permitido")}
      {button(
        () => editor.chain().focus().toggleBulletList().run(),
        List,
        "Lista",
      )}
      {button(
        () => editor.chain().focus().toggleOrderedList().run(),
        ListOrdered,
        "Lista numerada",
      )}
      {button(
        () => editor.chain().focus().toggleBlockquote().run(),
        Quote,
        "Cita",
      )}
      {button(
        () => editor.chain().focus().toggleCodeBlock().run(),
        Code2,
        "Código",
      )}
      {button(
        () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        Table2,
        "Tabla",
      )}
    </div>
  );
}

function RichEditor({ value, onChange, syncToken, onSynced }) {
  const onSyncedRef = useRef(onSynced);
  useEffect(() => {
    onSyncedRef.current = onSynced;
  }, [onSynced]);
  const editor = useEditor({
    extensions: articleExtensions,
    content: parseContent(value),
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON()),
    editorProps: { attributes: { class: "article-editor" } },
  });
  const [mediaKind, setMediaKind] = useState("");
  useEffect(() => {
    if (!editor) return;
    const nextContent = parseContent(value);
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(nextContent)) {
      editor.commands.setContent(nextContent, false);
    }
    onSyncedRef.current?.(syncToken);
  }, [editor, value, syncToken]);
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--bg)]">
      <Toolbar editor={editor} onOpenMedia={setMediaKind} />
      <EditorContent editor={editor} />
      <MediaLibrary open={Boolean(mediaKind)} onClose={() => setMediaKind("")} accept={mediaKind} onSelect={(item) => {
        if (mediaKind === "video") editor?.chain().focus().setLocalVideo({ src: item.url }).run();
        else if (mediaKind === "audio") editor?.chain().focus().setAudio({ src: item.url }).run();
        else editor?.chain().focus().setImage({ src: item.url, alt: item.alt || "" }).run();
        setMediaKind("");
      }} />
    </div>
  );
}

const markdownTemplates = [
  { label: "Encabezado", value: "## Nuevo encabezado\n\n" },
  { label: "Cita", value: "> Una cita que merece atención.\n\n" },
  { label: "Enlace", value: "[Texto del enlace](https://example.com)" },
  { label: "Imagen", value: "![Descripción de la imagen](https://example.com/imagen.jpg)" },
  { label: "Vídeo local", value: "@[video](/uploads/video.mp4)" },
  { label: "Audio", value: "@[audio](/uploads/audio.mp3)" },
  { label: "YouTube", value: "@[youtube](https://www.youtube.com/watch?v=VIDEO_ID)" },
  { label: "Vimeo", value: "@[vimeo](https://vimeo.com/VIDEO_ID)" },
  { label: "Embed seguro", value: "@[embed](https://www.figma.com/embed?embed_host=share)" },
  { label: "Lista", value: "- Primer punto\n- Segundo punto\n- Tercer punto\n" },
  { label: "Código", value: "```js\nconst ejemplo = true\n```\n" },
  { label: "Tabla", value: "| Columna | Detalle |\n| --- | --- |\n| Valor | Contenido |\n" },
  { label: "Alerta", value: "> **Nota:** Añade aquí el mensaje importante.\n\n" },
];

function MarkdownEditor({ value, onChange }) {
  const textarea = useRef(null);
  const [view, setView] = useState("editor");
  const [expanded, setExpanded] = useState(false);
  const update = (next) => onChange(next);
  const insert = (template) => {
    const element = textarea.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const prefix = start > 0 && !value.slice(0, start).endsWith("\n\n") ? "\n\n" : "";
    update(`${value.slice(0, start)}${prefix}${template}${value.slice(end)}`);
    requestAnimationFrame(() => {
      const cursor = start + prefix.length + template.length;
      element.focus();
      element.setSelectionRange(cursor, cursor);
    });
  };
  const editor = (
    <textarea
      ref={textarea}
      value={value}
      onChange={(event) => update(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          insert("  ");
        }
        if (event.key === "Escape" && expanded) setExpanded(false);
      }}
      spellCheck="true"
      aria-label="Editor Markdown"
      className="markdown-editor-input"
      placeholder="Escribe en Markdown..."
    />
  );
  const preview = <div className="markdown-preview article-content" aria-label="Vista previa Markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{ img: ({ src, ...props }) => <img {...props} src={resolveMediaUrl(src)} />, video: ({ src, ...props }) => <video {...props} src={resolveMediaUrl(src)} />, p: ({ children, node }) => { const directive = parseMediaDirectiveChildren(node?.children); return directive ? <MediaEmbed {...directive} /> : <p>{children}</p>; } }}>{value || "_La vista previa aparecerá aquí._"}</ReactMarkdown></div>;

  return (
    <div className={`markdown-editor ${expanded ? "is-expanded" : ""}`}>
      <div className="markdown-editor-bar">
        <div className="markdown-tabs" role="tablist" aria-label="Vista Markdown">
          {[['editor', 'Editor'], ['split', 'Split'], ['preview', 'Preview']].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={view === id ? "is-active" : ""}>{label}</button>)}
        </div>
        <button type="button" onClick={() => setExpanded((open) => !open)} className="markdown-expand" aria-label={expanded ? "Cerrar editor expandido" : "Expandir editor"} title={expanded ? "Cerrar expansión" : "Expandir editor"}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
      </div>
      <div className="markdown-templates" aria-label="Insertar plantilla">{markdownTemplates.map((template) => <button type="button" key={template.label} onClick={() => insert(template.value)}>{template.label}</button>)}</div>
      <div className={`markdown-workspace markdown-workspace--${view}`}>
        {(view === "editor" || view === "split") && editor}
        {(view === "preview" || view === "split") && preview}
      </div>
    </div>
  );
}

export function AdminBlogList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "articles", { search, status, page }],
    queryFn: () =>
      adminArticlesApi.list({
        search: search || undefined,
        status: status || undefined,
        page,
        limit: 20,
      }),
  });
  const result = pageData(query.data);
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--fg-faint)]">
            Gestión de contenido
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Blog</h1>
        </div>
        <Link
          to="/admin/blog/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-fg)]"
        >
          <Plus size={16} /> Nuevo artículo
        </Link>
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar título o slug"
          className={field}
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className={`${field} w-auto`}
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="scheduled">Programado</option>
        </select>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        {query.isLoading ? (
          <p className="p-5 text-sm text-[var(--fg-muted)]">Cargando...</p>
        ) : (
          result.items.map((item) => (
            <div
              key={idOf(item)}
              className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-4 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--fg-faint)]">
                  /{item.slug}
                </p>
                <MetricSummary item={item} className="mt-2" />
              </div>
              <span className="rounded-full bg-[var(--bg-soft)] px-2 py-1 text-xs">
                {item.status}
              </span>
               <Link
                 to={`/admin/blog/${idOf(item)}`}
                 className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm"
               >
                 Editar
               </Link>
               <a
                 href={`/blog/${item.slug}`}
                 target="_blank"
                 rel="noreferrer"
                 className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm"
               >
                 <Eye size={15} /> Ver
               </a>
             </div>
          ))
        )}
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-[var(--fg-muted)]">{result.total} artículos</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            disabled={page >= result.totalPages}
            onClick={() => setPage(page + 1)}
            className="disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}

function TaxonomyManager({ type, title }) {
  const client = useQueryClient();
  const [value, setValue] = useState("");
  const api = adminArticlesApi[type];
  const query = useQuery({
    queryKey: ["admin", "article", type],
    queryFn: api.list,
  });
  const create = useMutation({
    mutationFn: () => api.create({ name: value }),
    onSuccess: () => {
      setValue("");
      client.invalidateQueries({ queryKey: ["admin", "article", type] });
      client.invalidateQueries({ queryKey: [`article-${type}`] });
      toast.success(`${title} creado`);
    },
    onError: (e) => toast.error(error(e)),
  });
  const remove = useMutation({
    mutationFn: api.remove,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin", "article", type] }),
    onError: (e) => toast.error(error(e)),
  });
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <h2 className="font-semibold">{title}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) create.mutate();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={`Nueva ${title.toLowerCase()}`}
          className={field}
        />
        <button className="rounded-lg bg-[var(--accent)] px-3 text-sm text-[var(--accent-fg)]">
          Añadir
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {(query.data || []).map((item) => (
          <span
            key={idOf(item) || label(item)}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-soft)] px-2 py-1 text-xs"
          >
            {label(item)}
            <button
              type="button"
              onClick={() => remove.mutate(idOf(item))}
              aria-label="Eliminar"
            >
              <Trash2 size={12} />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}

export function AdminTaxonomies() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--fg-faint)]">
        Blog
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Categorías y tags
      </h1>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <TaxonomyManager type="categories" title="Categorías" />
        <TaxonomyManager type="tags" title="Tags" />
      </div>
    </section>
  );
}

export function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const isNew = !id || id === "nuevo";
  const slugEdited = useRef(false);
  const [editorMode, setEditorMode] = useState("visual");
  const [markdown, setMarkdown] = useState("");
  const [hydrationVersion, setHydrationVersion] = useState(isNew ? 1 : 0);
  const hydratedRef = useRef(isNew);
  const article = useQuery({
    queryKey: ["admin", "article", id],
    queryFn: () => adminArticlesApi.get(id),
    enabled: !isNew,
  });
  const categories = useQuery({
    queryKey: ["admin", "article", "categories"],
    queryFn: adminArticlesApi.categories.list,
  });
  const tags = useQuery({
    queryKey: ["admin", "article", "tags"],
    queryFn: adminArticlesApi.tags.list,
  });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: { type: "doc", content: [] },
      status: "draft",
      scheduledAt: "",
      category: "",
      tags: [],
      featured: false,
      coverImage: "",
      useCoverAsThumbnail: true,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    },
  });
  useEffect(() => {
    hydratedRef.current = isNew;
    if (!isNew) setHydrationVersion(0);
  }, [id, isNew]);
  useEffect(() => {
    if (article.data) {
      // Do not let the initial editor document be saved while remote content hydrates.
      hydratedRef.current = false;
      form.reset({
        ...article.data,
        category:
          idOf(article.data.categories?.[0]) ||
          article.data.categories?.[0] ||
          "",
        tags: (article.data.tags || []).map((item) => idOf(item) || item),
        scheduledAt: article.data.scheduledAt
          ? String(article.data.scheduledAt).slice(0, 16)
          : "",
        content: parseContent(article.data.content),
        useCoverAsThumbnail: article.data.useCoverAsThumbnail ?? true,
        seoKeywords: "",
      });
      setMarkdown(toMarkdown(article.data.content));
      setHydrationVersion((version) => version + 1);
    }
  }, [article.data, form]);
  const payload = (values) => {
    const data = {
      ...values,
      categories: values.category ? [values.category] : [],
      scheduledAt:
        values.status === "scheduled" && values.scheduledAt
          ? new Date(values.scheduledAt).toISOString()
          : undefined,
    };
    delete data.slug;
    delete data.category;
    delete data.featured;
    delete data.seoKeywords;
    delete data._id;
    delete data.id;
    delete data.author;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;
    delete data.metrics;
    return data;
  };
  const save = useMutation({
    mutationFn: (values) =>
      isNew
        ? adminArticlesApi.create(payload(values))
        : adminArticlesApi.update(id, payload(values)),
    onSuccess: (item) => {
      client.invalidateQueries({ queryKey: ["admin", "articles"] });
      client.invalidateQueries({ queryKey: ["articles"] });
      if (isNew) {
        toast.success("Borrador creado");
        navigate(`/admin/blog/${idOf(item)}`);
      } else toast.success("Artículo guardado");
    },
    onError: (e) => toast.error(error(e)),
  });
  const watched = form.watch();
  const autosave = useMutation({
    mutationFn: (values) => adminArticlesApi.update(id, payload(values)),
    onSuccess: (_, values) => {
      client.invalidateQueries({ queryKey: ["admin", "articles"] });
      form.reset(values);
    },
    onError: (e) => toast.error(`Autoguardado: ${error(e)}`),
  });
  const first = useRef(true);
  useEffect(() => {
    if (isNew || first.current) {
      first.current = false;
      return;
    }
    if (
      !hydratedRef.current ||
      !article.isSuccess ||
      !form.formState.isDirty ||
      autosave.isPending
    )
      return;
    const timer = window.setTimeout(
      () => {
        if (hydratedRef.current && article.isSuccess)
          autosave.mutate(form.getValues());
      },
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [watched, isNew, form, autosave, article.isSuccess]);
  const status = form.watch("status");
  const selectedTags = form.watch("tags") || [];
  const changeEditorMode = (nextMode) => {
    if (nextMode === editorMode) return;
    if (nextMode === "markdown") {
      setMarkdown(toMarkdown(form.getValues("content")));
    } else {
      form.setValue("content", fromMarkdown(markdown), { shouldDirty: true });
    }
    setEditorMode(nextMode);
  };
  if (article.isLoading)
    return (
      <p className="text-sm text-[var(--fg-muted)]">Cargando artículo...</p>
    );
  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--fg-faint)]">
            Blog
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {isNew ? "Nuevo artículo" : "Editar artículo"}
          </h1>
          <MetricSummary item={article.data} className="mt-3" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--fg-faint)]">
            {autosave.isPending
              ? "Autoguardando..."
              : !isNew && form.formState.isDirty
                ? "Cambios pendientes"
                : ""}
          </span>
          <button
            disabled={save.isPending}
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-fg)]"
          >
            {save.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-[var(--fg-muted)]">
            Título
            <input
              {...form.register("title", {
                onChange: (event) => {
                  if (!slugEdited.current)
                    form.setValue("slug", slugify(event.target.value), {
                      shouldDirty: true,
                    });
                },
              })}
              className={field}
            />
            {form.formState.errors.title && (
              <span className="text-red-600">
                {form.formState.errors.title.message}
              </span>
            )}
          </label>
          <label className="text-xs font-medium text-[var(--fg-muted)]">
            Slug
            <input
              {...form.register("slug", {
                onChange: () => {
                  slugEdited.current = true;
                },
              })}
              className={field}
            />
            {form.formState.errors.slug && (
              <span className="text-red-600">
                {form.formState.errors.slug.message}
              </span>
            )}
          </label>
          <label className="text-xs font-medium text-[var(--fg-muted)] sm:col-span-2">
            Extracto
            <textarea
              {...form.register("excerpt")}
              rows="3"
              className={field}
            />
          </label>
        </div>
         <div className="mt-5">
           <div className="flex flex-wrap items-center justify-between gap-3">
             <span className="text-xs font-medium text-[var(--fg-muted)]">Contenido</span>
             <div className="editor-mode-tabs" role="tablist" aria-label="Modo de edición">
               <button type="button" role="tab" aria-selected={editorMode === "visual"} onClick={() => changeEditorMode("visual")} className={editorMode === "visual" ? "is-active" : ""}>Visual</button>
               <button type="button" role="tab" aria-selected={editorMode === "markdown"} onClick={() => changeEditorMode("markdown")} className={editorMode === "markdown" ? "is-active" : ""}>Markdown</button>
             </div>
           </div>
           <div className="mt-1.5">
              {editorMode === "visual" ? (
                isNew || hydrationVersion > 0 ? (
                  <RichEditor
                    key="visual"
                    value={form.watch("content")}
                    syncToken={hydrationVersion}
                    onSynced={(token) => {
                      if (!isNew && token === hydrationVersion)
                        hydratedRef.current = true;
                    }}
                    onChange={(content) =>
                      form.setValue("content", content, { shouldDirty: true })
                    }
                  />
                ) : null
              ) : (
                <MarkdownEditor
                  value={markdown}
                  onChange={(nextMarkdown) => {
                    setMarkdown(nextMarkdown);
                    form.setValue("content", fromMarkdown(nextMarkdown), {
                      shouldDirty: true,
                    });
                  }}
                />
              )}
           </div>
         </div>
      </section>
      <section className="grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:grid-cols-2">
        <label className="text-xs font-medium text-[var(--fg-muted)]">
          Estado
          <select {...form.register("status")} className={field}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="scheduled">Programado</option>
          </select>
        </label>
        {status === "scheduled" && (
          <label className="text-xs font-medium text-[var(--fg-muted)]">
            Fecha de publicación
            <input
              type="datetime-local"
              {...form.register("scheduledAt")}
              className={field}
            />
          </label>
        )}
        <label className="text-xs font-medium text-[var(--fg-muted)]">
          Categoría
          <select {...form.register("category")} className={field}>
            <option value="">Sin categoría</option>
            {(categories.data || []).map((item) => (
              <option
                key={idOf(item) || label(item)}
                value={idOf(item) || label(item)}
              >
                {label(item)}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="text-xs font-medium text-[var(--fg-muted)]">
            Tags
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {(tags.data || []).map((item) => {
              const value = idOf(item) || label(item);
              return (
                <label
                  key={value}
                  className="inline-flex items-center gap-1 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(value)}
                    onChange={() =>
                      form.setValue(
                        "tags",
                        selectedTags.includes(value)
                          ? selectedTags.filter((tag) => tag !== value)
                          : [...selectedTags, value],
                        { shouldDirty: true },
                      )
                    }
                  />
                  {label(item)}
                </label>
              );
            })}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("featured")} /> Artículo
          destacado
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("useCoverAsThumbnail")} />{" "}
          Usar portada como miniatura
        </label>
        <MediaPicker
          value={form.watch("coverImage")}
          label="Imagen de portada"
          accept="image"
          onChange={(value) =>
            form.setValue("coverImage", value, { shouldDirty: true })
          }
        />
      </section>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="font-semibold">SEO</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-[var(--fg-muted)]">
            Título SEO
            <input {...form.register("seoTitle")} className={field} />
          </label>
          <label className="text-xs font-medium text-[var(--fg-muted)]">
            Keywords (separadas por coma)
            <input {...form.register("seoKeywords")} className={field} />
          </label>
          <label className="text-xs font-medium text-[var(--fg-muted)] sm:col-span-2">
            Descripción SEO
            <textarea
              {...form.register("seoDescription")}
              rows="3"
              className={field}
            />
          </label>
        </div>
      </section>
    </form>
  );
}
