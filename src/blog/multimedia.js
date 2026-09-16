import { Node } from "@tiptap/core";
import Youtube from "@tiptap/extension-youtube";
import { createElement } from "react";
import { resolveMediaUrl } from "../api/client";

const EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
  "codepen.io",
  "codesandbox.io",
  "www.codesandbox.io",
  "www.figma.com",
  "figma.com",
]);

export const isVideoMedia = (item) =>
  Boolean(item?.mimeType?.startsWith("video/") || item?.mimetype?.startsWith("video/") || item?.type?.startsWith("video/") || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(item?.url || ""));

export function safeMediaUrl(value) {
  if (typeof value !== "string") return "";
  const url = value.trim();
  return /^(https?:\/\/|\/)/i.test(url) ? url : "";
}

export function youtubeUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const id = host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") || url.pathname.match(/^\/embed\/([^/]+)/)?.[1];
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
  } catch {
    return "";
  }
}

export function vimeoUrl(value) {
  try {
    const url = new URL(value);
    if (!["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname)) return "";
    const id = url.pathname.match(/(?:video\/)?(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : "";
  } catch {
    return "";
  }
}

export function safeEmbedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && EMBED_HOSTS.has(url.hostname) ? url.toString() : "";
  } catch {
    return "";
  }
}

const iframeAttributes = (HTMLAttributes) => [
  "div",
  { class: "article-media article-media--embed" },
  [
    "iframe",
    {
      ...HTMLAttributes,
      src: HTMLAttributes.src,
      title: HTMLAttributes.title || "Contenido incrustado",
      loading: "lazy",
      sandbox: "allow-scripts allow-same-origin allow-popups allow-forms",
      referrerpolicy: "strict-origin-when-cross-origin",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen",
      allowfullscreen: "true",
    },
  ],
];

const IframeNode = (name, normalise) =>
  Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
      return {
        src: { default: "", parseHTML: (element) => normalise(element.getAttribute("src")) },
        title: { default: "" },
      };
    },
    addCommands() {
      const command = `set${name[0].toUpperCase()}${name.slice(1)}`;
      return {
        [command]: (attributes) => ({ commands }) => commands.insertContent({ type: name, attrs: { ...attributes, src: normalise(attributes.src) } }),
      };
    },
    parseHTML() {
      // Only recognise our own serialized iframes; generic iframe parsing would let
      // the first extension claim embeds intended for another allowlisted provider.
      return [{ tag: `iframe[data-${name.toLowerCase()}]` }];
    },
    renderHTML({ HTMLAttributes }) {
      const src = normalise(HTMLAttributes.src);
      return src ? iframeAttributes({ ...HTMLAttributes, src, [`data-${name.toLowerCase()}`]: "" }) : ["div"];
    },
  });

export const Vimeo = IframeNode("vimeo", vimeoUrl);
export const SafeEmbed = IframeNode("safeEmbed", safeEmbedUrl);

export const LocalVideo = Node.create({
  name: "localVideo",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: "", parseHTML: (element) => safeMediaUrl(element.getAttribute("src")) } };
  },
  addCommands() {
    return {
      setLocalVideo: (attributes) => ({ commands }) => commands.insertContent({ type: "localVideo", attrs: { ...attributes, src: safeMediaUrl(attributes.src) } }),
    };
  },
  parseHTML() {
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const src = safeMediaUrl(HTMLAttributes.src);
    return src ? ["div", { class: "article-media article-media--video" }, ["video", { src: resolveMediaUrl(src), controls: "true", preload: "metadata" }]] : ["div"];
  },
});

export const Audio = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: "", parseHTML: (element) => safeMediaUrl(element.getAttribute("src")) } };
  },
  addCommands() {
    return {
      setAudio: (attributes) => ({ commands }) => commands.insertContent({ type: "audio", attrs: { ...attributes, src: safeMediaUrl(attributes.src) } }),
    };
  },
  parseHTML() {
    return [{ tag: "audio[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const src = safeMediaUrl(HTMLAttributes.src);
    return src ? ["div", { class: "article-media article-media--audio" }, ["audio", { src: resolveMediaUrl(src), controls: "true", preload: "metadata" }]] : ["div"];
  },
});

export const mediaExtensions = [
  Youtube.configure({ HTMLAttributes: { class: "article-youtube" } }),
  Vimeo,
  LocalVideo,
  Audio,
  SafeEmbed,
];

export function parseMediaDirective(value) {
  const match = typeof value === "string" && value.trim().match(/^@\[(youtube|vimeo|video|audio|embed)\]\((.+)\)$/i);
  if (!match) return null;
  const [, kind, rawUrl] = match;
  const src = ({ youtube: youtubeUrl, vimeo: vimeoUrl, video: safeMediaUrl, audio: safeMediaUrl, embed: safeEmbedUrl })[kind.toLowerCase()](rawUrl.trim());
  return src ? { kind: kind.toLowerCase(), src } : null;
}

const textOf = (node) =>
  node?.text ?? node?.value ?? node?.children?.map(textOf).join("") ?? "";

// Markdown parsers turn @[vimeo](...) into a text "@" followed by a link.
// Accept only that complete, standalone shape so ordinary links stay untouched.
export function parseMediaDirectiveChildren(children) {
  if (!Array.isArray(children) || children.length !== 2) return null;
  const [prefix, link] = children;
  const href = link?.attrs?.href || link?.url || link?.properties?.href;
  const isLink = link?.type === "link" || (link?.type === "element" && link.tagName === "a");
  if (textOf(prefix) !== "@" || !isLink || typeof href !== "string") return null;
  return parseMediaDirective(`@[${textOf(link)}](${href})`);
}

const parseMediaDirectiveParagraph = (node) => {
  if (node.type !== "paragraph") return null;
  if (node.content?.length === 1 && node.content[0].type === "text") {
    return parseMediaDirective(node.content[0].text);
  }

  // Tiptap's Markdown parser represents the link as text with a link mark.
  if (node.content?.length !== 2 || node.content[0]?.text !== "@") return null;
  const link = node.content[1];
  const href = link?.marks?.find((mark) => mark.type === "link")?.attrs?.href;
  return typeof href === "string"
    ? parseMediaDirective(`@[${link.text || ""}](${href})`)
    : null;
};

const nodeForDirective = ({ kind, src }) => ({
  type: ({ youtube: "youtube", vimeo: "vimeo", video: "localVideo", audio: "audio", embed: "safeEmbed" })[kind],
  attrs: { src },
});

export function normaliseMediaContent(content) {
  if (!content || typeof content !== "object") return content;
  const visit = (node) => {
    const directive = parseMediaDirectiveParagraph(node);
    if (directive) return nodeForDirective(directive);
    const normalisers = { youtube: youtubeUrl, vimeo: vimeoUrl, localVideo: safeMediaUrl, audio: safeMediaUrl, safeEmbed: safeEmbedUrl };
    const normalise = normalisers[node.type];
    if (normalise) {
      const src = normalise(node.attrs?.src);
      if (!src) return { type: "paragraph", content: [{ type: "text", text: "[Contenido multimedia no permitido]" }] };
      return { ...node, attrs: { ...node.attrs, src }, content: node.content?.map(visit) };
    }
    return { ...node, content: node.content?.map(visit) };
  };
  return visit(content);
}

export function mediaDirectivesForMarkdown(content) {
  const visit = (node) => {
    const kinds = { youtube: "youtube", vimeo: "vimeo", localVideo: "video", audio: "audio", safeEmbed: "embed" };
    if (kinds[node.type]) return { type: "paragraph", content: [{ type: "text", text: `@[${kinds[node.type]}](${node.attrs?.src || ""})` }] };
    return { ...node, content: node.content?.map(visit) };
  };
  return visit(normaliseMediaContent(content));
}

export function MediaEmbed({ kind, src, title }) {
  const safe = ({ youtube: youtubeUrl, vimeo: vimeoUrl, video: safeMediaUrl, audio: safeMediaUrl, embed: safeEmbedUrl })[kind]?.(src);
  if (!safe) return null;
  if (kind === "video") return createElement("div", { className: "article-media article-media--video" }, createElement("video", { src: resolveMediaUrl(safe), controls: true, preload: "metadata" }));
  if (kind === "audio") return createElement("div", { className: "article-media article-media--audio" }, createElement("audio", { src: resolveMediaUrl(safe), controls: true, preload: "metadata" }));
  return createElement("div", { className: "article-media article-media--embed" }, createElement("iframe", { src: safe, title: title || "Contenido incrustado", loading: "lazy", sandbox: "allow-scripts allow-same-origin allow-popups allow-forms", referrerPolicy: "strict-origin-when-cross-origin", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen", allowFullScreen: true }));
}
