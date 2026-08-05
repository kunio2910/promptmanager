"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  ChevronDown,
  Copy,
  Diamond,
  Download,
  Eye,
  FileJson2,
  FolderOpen,
  GripVertical,
  Library,
  Lightbulb,
  Moon,
  Palette,
  Pencil,
  Plus,
  Search,
  Settings,
  Shirt,
  Sparkles,
  Sun,
  Swords,
  Trash2,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type Screen = "create" | "library" | "json" | "settings";
type SettingsTab = "options" | "fields";
type IconName =
  | "spark"
  | "folder"
  | "library"
  | "json"
  | "settings"
  | "plus"
  | "trash"
  | "edit"
  | "copy"
  | "eye"
  | "download"
  | "upload"
  | "search"
  | "chevron"
  | "arrow"
  | "person"
  | "shirt"
  | "sword"
  | "camera"
  | "sun"
  | "moon"
  | "palette"
  | "diamond"
  | "grip"
  | "bulb";

type Group = {
  key: string;
  number: number;
  label: string;
  shortLabel: string;
  icon: IconName;
  fields: FieldConfig[];
};

type FieldConfig = {
  key: string;
  label: string;
  type: "text" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

type PromptRecord = {
  id: number;
  title: string;
  subject: string;
  topic: string;
  style: string;
  ratio: string;
  created: string;
  description: string;
  data: Record<string, string>;
};

const groups: Group[] = [
  {
    key: "subject",
    number: 1,
    label: "Chủ thể (Subject)",
    shortLabel: "Chủ thể",
    icon: "person",
    fields: [
      { key: "name", label: "Tên nhân vật / đối tượng", type: "text" },
      { key: "age", label: "Tuổi", type: "select", options: ["Thiếu niên", "Trẻ em", "Trưởng thành", "Người cao tuổi"] },
      { key: "gender", label: "Giới tính", type: "select", options: ["Nam", "Nữ", "Không xác định"] },
      { key: "appearance", label: "Ngoại hình", type: "text" },
      { key: "expression", label: "Biểu cảm / Tư thế", type: "text" },
    ],
  },
  {
    key: "clothing",
    number: 2,
    label: "Trang phục (Clothing)",
    shortLabel: "Trang phục",
    icon: "shirt",
    fields: [
      { key: "outfit", label: "Trang phục", type: "text" },
      { key: "color", label: "Màu sắc", type: "text" },
      { key: "accessories", label: "Phụ kiện", type: "text" },
    ],
  },
  {
    key: "weapon_prop",
    number: 3,
    label: "Vũ khí / Vật dụng (Weapon / Prop)",
    shortLabel: "Vũ khí / Vật dụng",
    icon: "sword",
    fields: [
      { key: "item", label: "Vũ khí / Vật dụng", type: "text" },
      { key: "description", label: "Mô tả thêm (tùy chọn)", type: "text" },
    ],
  },
  {
    key: "environment",
    number: 4,
    label: "Bối cảnh (Environment)",
    shortLabel: "Bối cảnh",
    icon: "person",
    fields: [
      { key: "location", label: "Địa điểm", type: "text" },
      { key: "time", label: "Thời gian", type: "select", options: ["Hoàng hôn", "Bình minh", "Ban ngày", "Ban đêm"] },
      { key: "weather", label: "Thời tiết", type: "select", options: ["Trời quang", "Có mây", "Mưa nhẹ", "Sương mù"] },
      { key: "scene", label: "Mô tả cảnh quan", type: "text" },
    ],
  },
  {
    key: "camera",
    number: 5,
    label: "Camera / Góc nhìn",
    shortLabel: "Camera / Góc nhìn",
    icon: "camera",
    fields: [
      { key: "shot", label: "Góc máy", type: "select", options: ["Close-up", "Medium Shot", "Full body", "Wide Shot"] },
      { key: "angle", label: "Góc nhìn", type: "select", options: ["Eye level", "Bird view", "Low angle", "Over shoulder"] },
      { key: "aspect_ratio", label: "Tỷ lệ khung hình", type: "select", options: ["16:9", "9:16", "1:1"] },
      { key: "motion", label: "Chuyển động", type: "select", options: ["Tĩnh", "Chuyển động nhẹ", "Hành động"] },
    ],
  },
  {
    key: "lighting",
    number: 6,
    label: "Ánh sáng (Lighting)",
    shortLabel: "Ánh sáng",
    icon: "sun",
    fields: [
      { key: "type", label: "", type: "select", options: ["Golden Hour", "Sunrise", "Sunset", "Soft Light", "Hard Light"] },
      { key: "direction", label: "Hướng sáng", type: "select", options: ["Từ phía sau & bên trái", "Từ phía trước", "Ánh sáng bên hông"] },
      { key: "intensity", label: "Cường độ", type: "select", options: ["Mạnh vừa", "Mềm", "Mạnh"] },
    ],
  },
  {
    key: "style",
    number: 7,
    label: "Phong cách (Style)",
    shortLabel: "Phong cách",
    icon: "palette",
    fields: [
      { key: "style", label: "Phong cách", type: "select", options: ["Pixar / 3D Animation", "Realistic", "Photorealistic", "Fantasy", "Cinematic", "Anime"] },
      { key: "detail", label: "Độ chi tiết", type: "select", options: ["Cao", "Vừa", "Thấp"] },
      { key: "palette", label: "Bảng màu", type: "select", options: ["Ấm áp, tự nhiên", "Lạnh, tương phản", "Đơn sắc"] },
    ],
  },
  {
    key: "quality",
    number: 8,
    label: "Chất lượng (Quality)",
    shortLabel: "Chất lượng",
    icon: "diamond",
    fields: [
      { key: "resolution", label: "Độ phân giải", type: "select", options: ["8K", "4K", "2K"] },
      { key: "quality", label: "Chất lượng", type: "select", options: ["Ultra High Quality", "High Quality", "Masterpiece"] },
      { key: "negative", label: "Negative prompt (tùy chọn)", type: "text" },
    ],
  },
];

const defaultForm: Record<string, string> = {
  name: "David",
  age: "Thiếu niên",
  gender: "Nam",
  appearance: "Tóc xoăn nâu, mặt nâu, khuôn mặt hiền hậu, làn da rám nắng",
  expression: "Quyết tâm, nhìn xa xăm, đứng vững",
  outfit: "Áo choàng chăn chiên truyền thống",
  color: "Nâu đất, be",
  accessories: "Túi da nhỏ đeo bên hông",
  item: "Ná (sling)",
  description: "Ná da, dây thừng bện",
  location: "Thung lũng đá",
  time: "Hoàng hôn",
  weather: "Trời quang",
  scene: "Đồi đá, bụi cây khô, xa xa là những ngọn đồi",
  shot: "Medium Shot",
  angle: "Eye level",
  aspect_ratio: "16:9",
  motion: "Tĩnh",
  type: "Golden Hour",
  direction: "Từ phía sau & bên trái",
  intensity: "Mạnh vừa",
  style: "Pixar / 3D Animation",
  detail: "Cao",
  palette: "Ấm áp, tự nhiên",
  resolution: "8K",
  quality: "Ultra High Quality",
  negative: "blur, low quality, bad anatomy, watermark, text",
};

const initialPrompts: PromptRecord[] = [
  { id: 1, title: "David với ná - Hoàng hôn", subject: "David", topic: "Nhân vật", style: "Pixar 3D", ratio: "16:9", created: "08/05/2024 10:30", description: "Young David, determined teenage shepherd boy with curly brown hair, wearing traditional shepherd clothing and holding a leather sling. He stands in a rocky valley at sunset...", data: defaultForm },
  { id: 2, title: "Chúa Giêsu cầu nguyện", subject: "Jesus", topic: "Nhân vật", style: "Realistic", ratio: "4:3", created: "05/05/2024 20:15", description: "A peaceful and reverent scene of Jesus praying beneath the night sky, soft moonlight illuminating the landscape...", data: { ...defaultForm, name: "Jesus", time: "Ban đêm", style: "Realistic", aspect_ratio: "4:3" } },
  { id: 3, title: "Thiên thần", subject: "Angel", topic: "Nhân vật", style: "Fantasy", ratio: "9:16", created: "02/05/2024 14:20", description: "A luminous angel in a celestial atmosphere, surrounded by gentle warm light and soft clouds...", data: { ...defaultForm, name: "Angel", type: "Soft Light", style: "Fantasy", aspect_ratio: "9:16" } },
  { id: 4, title: "Môsê chia biển đỏ", subject: "Moses", topic: "Bối cảnh", style: "Epic", ratio: "16:9", created: "01/05/2024 09:45", description: "Moses raises his staff as the red sea parts, an epic cinematic landscape with dramatic clouds...", data: { ...defaultForm, name: "Moses", style: "Cinematic" } },
  { id: 5, title: "Nô-ê và con tàu", subject: "Noah", topic: "Bối cảnh", style: "Realistic", ratio: "16:9", created: "30/04/2024 18:30", description: "Noah standing near a great wooden ark under a dramatic, atmospheric sky...", data: { ...defaultForm, name: "Noah", location: "Biển", style: "Realistic" } },
  { id: 6, title: "Chúa Giáng Sinh", subject: "Giáng Sinh", topic: "Nhân vật", style: "Warm", ratio: "4:3", created: "28/04/2024 21:10", description: "A warm nativity scene with soft candle light, gentle expressions, and traditional details...", data: { ...defaultForm, name: "Giáng Sinh", type: "Candle Light", aspect_ratio: "4:3" } },
  { id: 7, title: "Chiến binh cổ đại", subject: "Chiến tranh", topic: "Nhân vật", style: "Epic", ratio: "16:9", created: "27/04/2024 16:05", description: "A powerful ancient warrior standing in a windswept valley, detailed armor and cinematic atmosphere...", data: { ...defaultForm, name: "Chiến binh cổ đại", outfit: "Giáp cổ đại", style: "Cinematic" } },
  { id: 8, title: "Cảnh hoàng hôn", subject: "Hoàng hôn", topic: "Phong cảnh", style: "Realistic", ratio: "16:9", created: "26/04/2024 19:50", description: "A quiet golden hour landscape with rocky terrain and distant mountains...", data: { ...defaultForm, name: "Cảnh hoàng hôn", style: "Realistic" } },
  { id: 9, title: "Phong cách Pixar 3D", subject: "Phong cách", topic: "Phong cách", style: "Pixar 3D", ratio: "16:9", created: "25/04/2024 11:20", description: "A polished 3D animation portrait with expressive character details and warm colors...", data: { ...defaultForm, name: "Phong cách Pixar 3D", style: "Pixar / 3D Animation" } },
  { id: 10, title: "Thiên nhiên hùng vĩ", subject: "Phong cảnh", topic: "Phong cảnh", style: "Realistic", ratio: "16:9", created: "24/04/2024 08:40", description: "A majestic natural vista with layered mountains, soft atmospheric haze, and dramatic light...", data: { ...defaultForm, name: "Thiên nhiên hùng vĩ", style: "Realistic" } },
];

const optionLists: Record<string, string[]> = {
  subject: ["David", "Moses (Môsê)", "Jesus (Chúa Giêsu)", "Noah (Nô-ê)", "Saint Joseph (Thánh Giuse)", "Angel (Thiên thần)", "Shepherd (Người chăn chiên)", "King (Vua)"],
  clothing: ["Áo choàng chăn chiên", "Giáp", "Áo sơ mi", "Váy", "Quần", "Giày", "Khăn choàng", "Mũ", "Găng tay", "Trang sức", "Phụ kiện", "Màu sắc", "Chất liệu"],
  weapon_prop: ["Kiếm", "Khiên", "Cung", "Giáo", "Ná", "Sách", "Thánh giá", "Đèn lồng", "Bản đồ", "Gậy", "Hoa", "Nhạc cụ", "Ba lô", "Bình nước"],
  environment: ["Sa mạc", "Rừng", "Biển", "Núi", "Thành phố", "Đền thờ", "Lâu đài", "Đồng cỏ", "Hang động", "Bầu trời", "Mùa", "Thời tiết", "Thời gian", "Không khí"],
  camera: ["Close-up", "Medium", "Full body", "Wide", "Bird view", "Low angle", "Eye level", "Over shoulder", "16:9", "9:16", "1:1", "DOF", "Motion"],
  lighting: ["Golden Hour", "Sunrise", "Sunset", "Soft Light", "Hard Light", "Rim Light", "Studio", "Volumetric", "Moonlight", "Candle Light", "HDR"],
  style: ["Realistic", "Photorealistic", "Pixar", "Disney", "Anime", "Fantasy", "Cinematic", "Oil Painting", "Watercolor", "3D", "Low Poly", "Concept Art"],
  quality: ["8K", "Ultra Detail", "Masterpiece", "High Quality", "Sharp Focus", "Global Illumination", "Ray Tracing", "HDR"],
};

const iconComponents: Record<IconName, LucideIcon> = {
  spark: Sparkles,
  folder: FolderOpen,
  library: Library,
  json: FileJson2,
  settings: Settings,
  plus: Plus,
  trash: Trash2,
  edit: Pencil,
  copy: Copy,
  eye: Eye,
  download: Download,
  upload: Upload,
  search: Search,
  chevron: ChevronDown,
  arrow: ArrowRight,
  person: UserRound,
  shirt: Shirt,
  sword: Swords,
  camera: Camera,
  sun: Sun,
  moon: Moon,
  palette: Palette,
  diamond: Diamond,
  grip: GripVertical,
  bulb: Lightbulb,
};

function Icon({ name, size = 18, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  const IconComponent = iconComponents[name];
  return <IconComponent className={`icon icon-${name}`} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

function Stepper({ current }: { current: number }) {
  const steps = ["Nhập thông tin", "Xuất JSON", "Sinh prompt (AI Tool)", "Lưu lại"];
  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <div className="step-wrap" key={step}>
          <div className={`step ${current === index + 1 ? "active" : ""}`}>
            <span className="step-number">{index + 1}</span>
            <span>{step}</span>
          </div>
          {index < steps.length - 1 && <span className="step-arrow">→</span>}
        </div>
      ))}
    </div>
  );
}

function Sidebar({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const nav = [
    { key: "create" as Screen, icon: "folder" as IconName, label: "Nhập & tạo prompt" },
    { key: "library" as Screen, icon: "library" as IconName, label: "Thư viện prompt" },
    { key: "json" as Screen, icon: "json" as IconName, label: "Xuất / Nhập JSON" },
    { key: "settings" as Screen, icon: "settings" as IconName, label: "Cài đặt" },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Icon name="spark" size={40} /></div>
        <div><div className="brand-title">Prompt Manager</div><div className="brand-subtitle">Quản lý & tái sử dụng prompt</div></div>
      </div>
      <div className="sidebar-content">
        <button className="primary-button new-prompt" onClick={() => onNavigate("create")}><Icon name="plus" size={25} />Tạo prompt mới</button>
        <nav className="main-nav">
          {nav.map((item) => <button key={item.key} className={`nav-item ${screen === item.key ? "selected" : ""}`} onClick={() => onNavigate(item.key)}><Icon name={item.icon} size={20} /><span>{item.label}</span></button>)}
        </nav>
        <div className="quick-guide">
          <div className="guide-title"><Icon name="bulb" size={20} />Hướng dẫn nhanh</div>
          <p>1. Nhập thông tin vào các mục</p>
          <p>2. Xuất file JSON</p>
          <p>3. Dán JSON vào AI Tool để sinh prompt</p>
          <p>4. Dán prompt hoàn chỉnh vào đây để lưu</p>
        </div>
      </div>
    </aside>
  );
}

function Toolbar({ onImport, onSave, onClear }: { onImport: (event: ChangeEvent<HTMLInputElement>) => void; onSave: () => void; onClear: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = window.localStorage.getItem("prompt-manager-theme");
    return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("prompt-manager-theme", theme);
  }, [theme]);
  return (
    <div className="topbar">
      <Stepper current={1} />
      <div className="top-actions">
        <button className="outline-button" onClick={() => fileRef.current?.click()}><Icon name="folder" size={19} />Mở file JSON</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        <button className="outline-button" onClick={onSave}><Icon name="library" size={19} />Lưu prompt</button>
        <button className="outline-button danger" onClick={onClear}><Icon name="trash" size={18} />Xóa tất cả</button>
        <button className="theme-toggle" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
      </div>
    </div>
  );
}

function Field({ config, value, onChange }: { config: FieldConfig; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      {config.label && <span className="field-label">{config.label}</span>}
      {config.type === "select" ? (
        <span className="select-wrap"><select value={value || config.options?.[0] || ""} onChange={(event) => onChange(event.target.value)}>{config.options?.map((option) => <option key={option}>{option}</option>)}</select><Icon name="chevron" size={15} /></span>
      ) : <input value={value} placeholder={config.placeholder} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function GroupForm({ group, form, onUpdate }: { group: Group; form: Record<string, string>; onUpdate: (key: string, value: string) => void }) {
  return (
    <section className="form-group">
      <h3><Icon name={group.icon} size={20} /><span className="group-index">{group.number}.</span>{group.label}</h3>
      <div className={`field-grid fields-${group.fields.length}`}>
        {group.fields.map((field) => <Field key={field.key} config={field} value={form[field.key] || ""} onChange={(value) => onUpdate(field.key, value)} />)}
      </div>
    </section>
  );
}

function makePrompt(form: Record<string, string>) {
  return `Young ${form.name || "character"}, ${form.appearance || "distinctive appearance"}, ${form.expression || "expressive pose"}. ${form.outfit || "wearing detailed clothing"}, ${form.item || "holding a meaningful prop"}. Set in ${form.location || "a cinematic environment"} during ${form.time || "golden hour"}, ${form.weather || "atmospheric weather"}. ${form.shot || "Medium shot"}, ${form.angle || "eye level"}, ${form.aspect_ratio || "16:9"}. ${form.type || "soft light"}, ${form.direction || "directional lighting"}. ${form.style || "cinematic style"}, ${form.detail || "high detail"}, ${form.resolution || "8K"}, ${form.quality || "high quality"}.`;
}

function makeJson(form: Record<string, string>) {
  return {
    subject: { name: form.name, age: form.age, gender: form.gender, appearance: form.appearance, expression: form.expression },
    clothing: { outfit: form.outfit, color: form.color, accessories: form.accessories },
    weapon_prop: { item: form.item, description: form.description },
    environment: { location: form.location, time: form.time, weather: form.weather, description: form.scene },
    camera: { shot: form.shot, angle: form.angle, aspect_ratio: form.aspect_ratio, motion: form.motion },
    lighting: { type: form.type, direction: form.direction, intensity: form.intensity },
    style: { style: form.style, detail: form.detail, palette: form.palette },
    quality: { resolution: form.resolution, quality: form.quality, negative_prompt: form.negative },
  };
}

function JsonPreview({ form, full = false }: { form: Record<string, string>; full?: boolean }) {
  const json = JSON.stringify(makeJson(form), null, 2);
  return <div className={`json-code ${full ? "full" : ""}`}><pre>{json}</pre></div>;
}

function CreateView({ form, onUpdate, prompts, onNavigate, onSelectPrompt, configuredGroups }: { form: Record<string, string>; onUpdate: (key: string, value: string) => void; prompts: PromptRecord[]; onNavigate: (screen: Screen) => void; onSelectPrompt: (prompt: PromptRecord) => void; configuredGroups: Group[] }) {
  const generatedPrompt = makePrompt(form);
  const [promptState, setPromptState] = useState({ source: generatedPrompt, text: generatedPrompt });
  const promptDraft = promptState.source === generatedPrompt ? promptState.text : generatedPrompt;
  return (
    <div className="create-layout">
      <div className="panel form-panel">
        <div className="panel-heading"><h2>THÔNG TIN PROMPT</h2></div>
        <div className="form-scroll">{configuredGroups.map((group) => <GroupForm key={group.key} group={group} form={form} onUpdate={onUpdate} />)}</div>
      </div>
      <div className="create-right">
        <div className="panel preview-prompt">
          <div className="panel-heading"><h2>PREVIEW PROMPT <small>(sau khi sinh)</small></h2></div>
          <textarea className="prompt-text prompt-textarea" aria-label="Preview prompt có thể chỉnh sửa" value={promptDraft} onChange={(event) => setPromptState({ source: generatedPrompt, text: event.target.value })} />
          <div className="char-count">Số ký tự: {promptDraft.length}</div>
        </div>
        <div className="panel json-panel">
          <div className="panel-heading heading-actions"><h2>XEM TRƯỚC JSON <span className="valid-pill">✓ Hợp lệ</span></h2><button className="primary-button small-button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(makeJson(form), null, 2))}><Icon name="copy" size={17} />Copy JSON</button></div>
          <JsonPreview form={form} />
        </div>
        <div className="panel mini-library">
          <div className="panel-heading"><h2>THƯ VIỆN PROMPT</h2></div>
          <div className="library-mini-toolbar"><div className="searchbox"><Icon name="search" size={17} /><input placeholder="Tìm kiếm prompt..." /></div><select><option>Tất cả</option></select></div>
          <div className="mini-list">{prompts.slice(0, 3).map((prompt) => <div className="mini-prompt" key={prompt.id}><div><strong>{prompt.title}</strong><div className="tag-row"><span>{prompt.subject}</span><span>{prompt.style}</span><span>{prompt.ratio}</span></div></div><span className="mini-date">{prompt.created}</span><div className="row-actions"><button aria-label="Xem" onClick={() => onSelectPrompt(prompt)}><Icon name="eye" size={17} /></button><button aria-label="Sửa"><Icon name="edit" size={17} /></button><button aria-label="Sao chép"><Icon name="copy" size={17} /></button><button aria-label="Xóa" className="red-icon"><Icon name="trash" size={16} /></button></div></div>)}</div>
          <button className="view-all" onClick={() => onNavigate("library")}>Xem tất cả prompt <Icon name="arrow" size={17} /></button>
        </div>
        <div className="bottom-actions"><button className="outline-button" onClick={() => downloadJson(form)}><Icon name="upload" size={18} />Xuất JSON</button><button className="outline-button" onClick={() => document.getElementById("json-import-input")?.click()}><Icon name="download" size={18} />Nhập JSON</button><input id="json-import-input" type="file" accept="application/json" hidden /></div>
      </div>
    </div>
  );
}

function downloadJson(form: Record<string, string>) {
  const blob = new Blob([JSON.stringify(makeJson(form), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "prompt-manager.json"; anchor.click(); URL.revokeObjectURL(url);
}

function LibraryView({ prompts, search, setSearch, selected, onSelect, onDelete, onEdit, onCopy }: { prompts: PromptRecord[]; search: string; setSearch: (value: string) => void; selected: PromptRecord; onSelect: (prompt: PromptRecord) => void; onDelete: (id: number) => void; onEdit: (prompt: PromptRecord) => void; onCopy: (prompt: PromptRecord) => void }) {
  const filtered = prompts.filter((prompt) => `${prompt.title} ${prompt.subject} ${prompt.style}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="library-layout">
      <div className="panel library-table-panel">
        <div className="panel-heading"><h2>THƯ VIỆN PROMPT</h2></div>
        <div className="library-filter-row"><div className="searchbox wide"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm prompt..." /></div><select><option>Tất cả</option><option>Nhân vật</option><option>Phong cảnh</option></select><select><option>Mới nhất</option><option>Cũ nhất</option></select></div>
        <div className="table-head"><span className="checkbox"></span><span>Tên prompt</span><span>Chủ đề</span><span>Phong cách</span><span>Tạo lúc <Icon name="arrow" size={15} /></span><span></span></div>
        <div className="prompt-rows">{filtered.map((prompt) => <div className={`prompt-row ${selected.id === prompt.id ? "selected" : ""}`} key={prompt.id} onClick={() => onSelect(prompt)}><span className="checkbox"></span><div className="prompt-name"><strong>{prompt.title}</strong><div className="tag-row"><span>{prompt.subject}</span><span>{prompt.title.includes("Hoàng hôn") ? "Hoàng hôn" : prompt.topic}</span><span>{prompt.style}</span><span>{prompt.ratio}</span></div></div><span>{prompt.topic}</span><span>{prompt.style}</span><span>{prompt.created}</span><div className="row-actions"><button onClick={(event) => { event.stopPropagation(); onSelect(prompt); }} aria-label="Xem"><Icon name="eye" size={17} /></button><button onClick={(event) => { event.stopPropagation(); onEdit(prompt); }} aria-label="Sửa"><Icon name="edit" size={17} /></button><button onClick={(event) => { event.stopPropagation(); onCopy(prompt); }} aria-label="Sao chép"><Icon name="copy" size={17} /></button><button className="red-icon" onClick={(event) => { event.stopPropagation(); onDelete(prompt.id); }} aria-label="Xóa"><Icon name="trash" size={16} /></button></div></div>)}</div>
        <div className="pagination"><span>Hiển thị <select><option>10 / trang</option></select></span><div><button>‹</button><button className="active-page">1</button><button>2</button><button>3</button><button>...</button><button>12</button><button>›</button></div></div>
      </div>
      <PromptDetail prompt={selected} />
    </div>
  );
}

function PromptDetail({ prompt }: { prompt: PromptRecord }) {
  return <div className="detail-column"><div className="panel detail-panel"><div className="panel-heading"><h2>CHI TIẾT PROMPT</h2></div><h3>{prompt.title} <span className="ratio-pill">{prompt.ratio}</span></h3><div className="detail-meta"><span>Chủ đề: &nbsp;{prompt.topic}</span><span>Phong cách: &nbsp;{prompt.style}</span><span>Tạo lúc: &nbsp;{prompt.created}</span></div><strong>Mô tả ngắn</strong><p>{prompt.description}</p></div><div className="panel detail-json"><div className="panel-heading heading-actions"><h2>XEM TRƯỚC JSON <span className="valid-pill">✓ Hợp lệ</span></h2><button className="primary-button small-button"><Icon name="copy" size={17} />Copy JSON</button></div><JsonPreview form={prompt.data} /></div><button className="panel edit-information"><Icon name="edit" size={18} />Chỉnh sửa thông tin</button></div>;
}

function SettingsView({ tab, setTab, selectedGroup, setSelectedGroup, options, setOptions, fields, setFields }: { tab: SettingsTab; setTab: (tab: SettingsTab) => void; selectedGroup: string; setSelectedGroup: (key: string) => void; options: Record<string, string[]>; setOptions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>; fields: Record<string, FieldConfig[]>; setFields: React.Dispatch<React.SetStateAction<Record<string, FieldConfig[]>>> }) {
  const group = groups.find((item) => item.key === selectedGroup) || groups[0];
  const activeOptions = options[selectedGroup] || [];
  const activeFields = fields[selectedGroup] || group.fields;
  const addOption = () => { const value = window.prompt("Tên tùy chọn mới"); if (value?.trim()) setOptions((current) => ({ ...current, [selectedGroup]: [...(current[selectedGroup] || []), value.trim()] })); };
  const editOption = (index: number) => { const value = window.prompt("Sửa tên tùy chọn", activeOptions[index]); if (value?.trim()) setOptions((current) => ({ ...current, [selectedGroup]: (current[selectedGroup] || []).map((item, itemIndex) => itemIndex === index ? value.trim() : item) })); };
  const deleteOption = (index: number) => setOptions((current) => ({ ...current, [selectedGroup]: (current[selectedGroup] || []).filter((_, itemIndex) => itemIndex !== index) }));
  const addField = () => { const value = window.prompt("Tên trường mới"); if (value?.trim()) setFields((current) => ({ ...current, [selectedGroup]: [...(current[selectedGroup] || group.fields), { key: `custom_${Date.now()}`, label: value.trim(), type: "text" }] })); };
  const editField = (index: number) => { const value = window.prompt("Sửa tên trường", activeFields[index]?.label); if (value?.trim()) setFields((current) => ({ ...current, [selectedGroup]: activeFields.map((field, fieldIndex) => fieldIndex === index ? { ...field, label: value.trim() } : field) })); };
  return <div className="settings-view"><div className="settings-head"><div><h2>CÀI ĐẶT</h2><p>Quản lý danh sách tùy chọn và cấu trúc thông tin. Các thay đổi sẽ hiển thị trong mục &quot;Nhập &amp; tạo prompt&quot;.</p></div><div className="settings-tabs"><button className={tab === "options" ? "active" : ""} onClick={() => setTab("options")}>Quản lý tùy chọn</button><button className={tab === "fields" ? "active" : ""} onClick={() => setTab("fields")}>Quản lý trường thông tin</button></div></div><div className="settings-body"><div className="panel group-picker"><h3>CHỌN MỤC CẦN QUẢN LÝ</h3>{groups.map((item) => <button key={item.key} className={selectedGroup === item.key ? "selected" : ""} onClick={() => setSelectedGroup(item.key)}><Icon name={item.icon} size={19} /><span>{item.number}. {item.label}</span></button>)}</div><div className="panel settings-table"><div className="settings-table-title"><div><h2>{tab === "options" ? "QUẢN LÝ TÙY CHỌN" : "QUẢN LÝ TRƯỜNG THÔNG TIN"}: {group.number}. {group.label.toUpperCase()}</h2><p>{tab === "options" ? "Thêm, sửa, xóa các tùy chọn của mục này." : "Thêm, sửa, xóa hoặc sắp xếp thứ tự các trường thông tin của mục này."}</p></div><button className="primary-button" onClick={tab === "options" ? addOption : addField}><Icon name="plus" size={23} />{tab === "options" ? "Thêm tùy chọn" : "Thêm trường"}</button></div>{tab === "options" ? <OptionsTable options={activeOptions} onEdit={editOption} onDelete={deleteOption} /> : <FieldsTable fields={activeFields} onEdit={editField} onDelete={(index) => setFields((current) => ({ ...current, [selectedGroup]: activeFields.filter((_, itemIndex) => itemIndex !== index) }))} />}</div></div><p className="settings-note">* Các tùy chọn và trường thông tin bạn thêm/sửa sẽ được áp dụng ngay trong mục &quot;Nhập &amp; tạo prompt&quot;.</p></div>;
}

function OptionsTable({ options, onEdit, onDelete }: { options: string[]; onEdit: (index: number) => void; onDelete: (index: number) => void }) { return <><div className="settings-grid table-header option-grid"><span></span><span>Tên tùy chọn</span><span>Thứ tự <Icon name="arrow" size={14} /></span><span>Thao tác</span></div><div className="settings-rows">{options.map((option, index) => <div className="settings-grid settings-row option-grid" key={`${option}-${index}`}><span className="checkbox"></span><span>{option}</span><span className="order-input"><Icon name="grip" size={18} /><input value={index + 1} readOnly /></span><span className="row-actions"><button onClick={() => onEdit(index)}><Icon name="edit" size={17} /></button><button className="red-icon" onClick={() => onDelete(index)}><Icon name="trash" size={16} /></button></span></div>)}</div><div className="pagination"><span>Hiển thị <select><option>10 / trang</option></select></span><div><button>‹</button><button className="active-page">1</button><button>2</button><button>3</button><button>...</button><button>5</button><button>›</button></div></div></>; }

function FieldsTable({ fields, onEdit, onDelete }: { fields: FieldConfig[]; onEdit: (index: number) => void; onDelete: (index: number) => void }) { return <><div className="settings-grid table-header field-grid-settings"><span>Tên trường</span><span>Loại trường</span><span>Bắt buộc</span><span>Thứ tự <Icon name="arrow" size={14} /></span><span>Thao tác</span></div><div className="settings-rows">{fields.map((field, index) => <div className="settings-grid settings-row field-grid-settings" key={field.key}><span className="field-row-name"><Icon name="grip" size={18} />{field.label}</span><span>{field.type === "select" ? "Select" : "Text"}</span><span><span className={`required-pill ${index === 0 ? "yes" : ""}`}>{index === 0 ? "Có" : "Không"}</span></span><span><input className="order-number" value={index + 1} readOnly /></span><span className="row-actions"><button onClick={() => onEdit(index)}><Icon name="edit" size={17} /></button><button className="red-icon" onClick={() => onDelete(index)}><Icon name="trash" size={16} /></button></span></div>)}</div><div className="pagination"><span>Hiển thị <select><option>10 / trang</option></select></span><div><button>‹</button><button className="active-page">1</button><button>2</button><button>3</button><button>...</button><button>5</button><button>›</button></div></div></>; }

function JsonView({ form, onImport }: { form: Record<string, string>; onImport: (event: ChangeEvent<HTMLInputElement>) => void }) { const [raw, setRaw] = useState(JSON.stringify(makeJson(form), null, 2)); return <div className="json-view"><div className="panel json-editor"><div className="panel-heading heading-actions"><div><h2>XUẤT / NHẬP JSON</h2><p>Nhập JSON để cập nhật thông tin prompt hoặc xuất cấu trúc hiện tại.</p></div><div className="top-actions"><button className="outline-button" onClick={() => downloadJson(form)}><Icon name="upload" size={18} />Xuất JSON</button><button className="primary-button small-button" onClick={() => document.getElementById("json-screen-import")?.click()}><Icon name="download" size={18} />Nhập JSON</button><input id="json-screen-import" type="file" accept="application/json" hidden onChange={onImport} /></div></div><textarea value={raw} onChange={(event) => setRaw(event.target.value)} /><div className="json-editor-actions"><span className="valid-pill">✓ JSON hợp lệ</span><button className="primary-button" onClick={() => navigator.clipboard?.writeText(raw)}><Icon name="copy" size={17} />Copy JSON</button></div></div><div className="panel json-help"><h2>HƯỚNG DẪN</h2><p>1. Xuất JSON để dùng làm dữ liệu đầu vào cho AI Tool.</p><p>2. Dán JSON đã chỉnh sửa vào khung bên trái.</p><p>3. Nhập lại file JSON để cập nhật form.</p></div></div>; }

export default function Home() {
  const [screen, setScreen] = useState<Screen>("create");
  const [form, setForm] = useState<Record<string, string>>(defaultForm);
  const [prompts, setPrompts] = useState<PromptRecord[]>(initialPrompts);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecord>(initialPrompts[0]);
  const [search, setSearch] = useState("");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("options");
  const [selectedGroup, setSelectedGroup] = useState("subject");
  const [options, setOptions] = useState(optionLists);
  const [fields, setFields] = useState<Record<string, FieldConfig[]>>(() => Object.fromEntries(groups.map((group) => [group.key, group.fields])));
  const [toast, setToast] = useState("");
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const updateForm = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const savePrompt = () => { const newPrompt: PromptRecord = { id: Date.now(), title: `${form.name || "Prompt mới"} - ${form.time || "Bản nháp"}`, subject: form.name || "Chưa đặt tên", topic: "Nhân vật", style: form.style?.split(" /")[0] || "Realistic", ratio: form.aspect_ratio || "16:9", created: "08/05/2024 10:30", description: makePrompt(form), data: { ...form } }; setPrompts((current) => [newPrompt, ...current]); setSelectedPrompt(newPrompt); showToast("Đã lưu prompt vào thư viện"); };
  const clearAll = () => { setForm(defaultForm); showToast("Đã đặt lại thông tin prompt"); };
  const importJson = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)); const next = { ...form, ...parsed.subject, ...parsed.clothing, ...parsed.weapon_prop, ...parsed.environment, ...parsed.camera, ...parsed.lighting, ...parsed.style, ...parsed.quality, scene: parsed.environment?.description || form.scene, negative: parsed.quality?.negative_prompt || form.negative }; setForm(next); showToast("Đã nhập JSON thành công"); } catch { showToast("File JSON không hợp lệ"); } }; reader.readAsText(file); };
  const filteredSelected = useMemo(() => prompts.find((prompt) => prompt.id === selectedPrompt.id) || prompts[0] || initialPrompts[0], [prompts, selectedPrompt.id]);
  const configuredGroups = groups.map((group) => ({ ...group, fields: fields[group.key] || group.fields }));
  const content = screen === "create" ? <CreateView form={form} onUpdate={updateForm} prompts={prompts} onNavigate={setScreen} configuredGroups={configuredGroups} onSelectPrompt={(prompt) => { setSelectedPrompt(prompt); setForm(prompt.data); }} /> : screen === "library" ? <LibraryView prompts={prompts} search={search} setSearch={setSearch} selected={filteredSelected} onSelect={setSelectedPrompt} onDelete={(id) => { setPrompts((current) => current.filter((prompt) => prompt.id !== id)); showToast("Đã xóa prompt"); }} onEdit={(prompt) => { setForm(prompt.data); setScreen("create"); }} onCopy={(prompt) => { setPrompts((current) => [{ ...prompt, id: Date.now(), title: `${prompt.title} (bản sao)` }, ...current]); showToast("Đã sao chép prompt"); }} /> : screen === "settings" ? <SettingsView tab={settingsTab} setTab={setSettingsTab} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} options={options} setOptions={setOptions} fields={fields} setFields={setFields} /> : <JsonView form={form} onImport={importJson} />;
  return <div className="app-shell"><Sidebar screen={screen} onNavigate={setScreen} /><main className="main-area"><Toolbar onImport={importJson} onSave={savePrompt} onClear={clearAll} /><div className="content-area">{content}</div><footer className="app-footer">Prompt Manager · Quản lý & tái sử dụng prompt</footer></main>{toast && <div className="toast">{toast}</div>}</div>;
}
