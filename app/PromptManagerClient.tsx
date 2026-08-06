"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  ChevronDown,
  Cloud,
  Copy,
  Diamond,
  Download,
  Eye,
  FileJson2,
  FolderOpen,
  GripVertical,
  Image as ImageIcon,
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
  Workflow,
  type LucideIcon,
} from "lucide-react";

type Screen = "create" | "library" | "json" | "settings";
type SettingsTab = "options" | "fields";
type PromptCategory = "character" | "scenery" | "action";
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
  | "image"
  | "workflow"
  | "shirt"
  | "sword"
  | "camera"
  | "sun"
  | "moon"
  | "palette"
  | "diamond"
  | "grip"
  | "bulb"
  | "cloud";

type Group = {
  key: string;
  category?: PromptCategory;
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
  optionGroup?: string;
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
  imageUrl?: string;
  imageUrls?: Partial<Record<PromptCategory, string>>;
  data: Record<string, string>;
};

type CloudSyncConfig = {
  apiUrl: string;
};

type CloudSyncState = "idle" | "saving" | "loading" | "success" | "error";

const defaultCloudSyncConfig: CloudSyncConfig = {
  apiUrl: "https://script.google.com/macros/s/AKfycbwTYtjLpcBuVaX_jDNMJB8NqmwffhTbsvLmaOWxngFYFyGZd9nT7BgnIuIMcJvOxsOgmQ/exec",
};

type PromptImageUrls = Record<PromptCategory, string>;

function promptImagesFromForm(form: Record<string, string>): PromptImageUrls {
  return {
    character: form.image_url_character || form.image_url || "",
    scenery: form.image_url_scenery || "",
    action: form.image_url_action || "",
  };
}

function promptImagesFromRecord(value: Partial<PromptRecord> & { id?: string | number; data?: Record<string, string> }): PromptImageUrls {
  const legacyImageUrl = value.imageUrl || value.data?.image_url || "";
  return {
    character: value.imageUrls?.character || value.data?.image_url_character || legacyImageUrl,
    scenery: value.imageUrls?.scenery || value.data?.image_url_scenery || "",
    action: value.imageUrls?.action || value.data?.image_url_action || "",
  };
}

function formWithPromptImages(prompt: PromptRecord): Record<string, string> {
  const imageUrls = promptImagesFromRecord(prompt);
  return { ...prompt.data, image_url_character: imageUrls.character, image_url_scenery: imageUrls.scenery, image_url_action: imageUrls.action };
}

function normalizePromptRecord(value: Partial<PromptRecord> & { id?: string | number; data?: Record<string, string> }): PromptRecord {
  const imageUrls = promptImagesFromRecord(value);
  return {
    id: Number(value.id) || Date.now(),
    title: value.title || "Prompt mới",
    subject: value.subject || "Chưa đặt tên",
    topic: value.topic || "Nhân vật",
    style: value.style || "Realistic",
    ratio: value.ratio || "16:9",
    created: value.created || new Date().toLocaleString("vi-VN"),
    description: value.description || "",
    imageUrl: value.imageUrl || imageUrls.character,
    imageUrls,
    data: value.data || {},
  };
}

async function loadCloudData(config: CloudSyncConfig) {
  const url = `${config.apiUrl}?action=load`;
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json() as { ok?: boolean; error?: string; prompts?: Partial<PromptRecord>[]; options?: Record<string, string[]>; fields?: Record<string, FieldConfig[]> };
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Không thể tải dữ liệu từ Google Sheet");
  return payload;
}

async function syncCloudData(config: CloudSyncConfig, prompts: PromptRecord[], options: Record<string, string[]>, fields: Record<string, FieldConfig[]>) {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "sync", prompts, options, fields }),
  });
  const payload = await response.json() as { ok?: boolean; error?: string; prompts?: Partial<PromptRecord>[]; options?: Record<string, string[]>; fields?: Record<string, FieldConfig[]> };
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Không thể đồng bộ với Google Sheet");
  return payload;
}

const groups: Group[] = [
  {
    key: "subject",
    category: "character",
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
      { key: "pose", label: "Tư thế / hành động", type: "text" },
      { key: "ethnicity", label: "Dân tộc", type: "select", optionGroup: "subject", options: ["Dân tộc: Do Thái", "Dân tộc: La Mã", "Dân tộc: Trung Đông"] },
      { key: "profession", label: "Nghề nghiệp", type: "select", optionGroup: "subject", options: ["Nghề nghiệp: Người chăn chiên", "Nghề nghiệp: Chiến binh", "Nghề nghiệp: Vua"] },
      { key: "role", label: "Vai trò", type: "select", optionGroup: "subject", options: ["Vai trò: Nhân vật chính", "Vai trò: Nhân vật phụ", "Vai trò: Nhân vật nền"] },
      { key: "hair", label: "Kiểu tóc", type: "select", optionGroup: "subject", options: ["Tóc xoăn nâu", "Tóc dài đen", "Tóc ngắn vàng"] },
      { key: "eyes", label: "Màu mắt", type: "select", optionGroup: "subject", options: ["Mắt nâu", "Mắt xanh", "Mắt đen"] },
    ],
  },
  {
    key: "clothing",
    category: "character",
    number: 4,
    label: "Trang phục (Clothing)",
    shortLabel: "Trang phục",
    icon: "shirt",
    fields: [
      { key: "outfit", label: "Trang phục", type: "text" },
      { key: "color", label: "Màu sắc", type: "text" },
      { key: "accessories", label: "Phụ kiện", type: "text" },
      { key: "clothing_material", label: "Chất liệu", type: "select", optionGroup: "clothing", options: ["Da thuộc", "Vải thô", "Len"] },
      { key: "clothing_condition", label: "Tình trạng", type: "select", optionGroup: "clothing", options: ["Cũ, sờn", "Mới, sạch", "Trang trọng"] },
      { key: "outerwear", label: "Lớp áo ngoài", type: "text" },
      { key: "footwear", label: "Giày dép", type: "select", optionGroup: "clothing", options: ["Sandals da", "Giày da", "Chân trần"] },
      { key: "headwear", label: "Mũ / khăn trùm", type: "select", optionGroup: "clothing", options: ["Khăn trùm đầu", "Mũ vải", "Không có"] },
      { key: "gloves", label: "Găng tay", type: "select", optionGroup: "clothing", options: ["Găng tay da", "Găng tay vải", "Không có"] },
      { key: "jewelry", label: "Trang sức", type: "select", optionGroup: "clothing", options: ["Không có", "Bạc", "Vàng"] },
    ],
  },
  {
    key: "weapon_prop",
    category: "character",
    number: 5,
    label: "Vũ khí / Vật dụng (Weapon / Prop)",
    shortLabel: "Vũ khí / Vật dụng",
    icon: "sword",
    fields: [
      { key: "item", label: "Vũ khí / Vật dụng", type: "text" },
      { key: "description", label: "Mô tả thêm (tùy chọn)", type: "text" },
      { key: "secondary_item", label: "Vật dụng phụ", type: "text" },
      { key: "weapon_material", label: "Chất liệu", type: "select", optionGroup: "weapon_prop", options: ["Da thuộc", "Gỗ sồi", "Kim loại"] },
      { key: "weapon_condition", label: "Tình trạng", type: "select", optionGroup: "weapon_prop", options: ["Cũ, trầy xước", "Mới tinh", "Đã sử dụng"] },
      { key: "details", label: "Chi tiết hình dáng", type: "text" },
      { key: "count", label: "Số lượng", type: "text" },
    ],
  },
  {
    key: "environment",
    category: "scenery",
    number: 1,
    label: "Loại cảnh & Địa điểm",
    shortLabel: "Loại cảnh & Địa điểm",
    icon: "person",
    fields: [
      { key: "scene_type", label: "Loại cảnh", type: "select", optionGroup: "environment", options: ["Phong cảnh thiên nhiên", "Thành phố", "Nội thất", "Làng cổ"] },
      { key: "time", label: "Thời gian", type: "select", options: ["Hoàng hôn", "Bình minh", "Ban ngày", "Ban đêm"] },
    ],
  },
  {
    key: "scenery_location",
    category: "scenery",
    number: 2,
    label: "Địa điểm / Bối cảnh",
    shortLabel: "Địa điểm / Bối cảnh",
    icon: "image",
    fields: [
      { key: "location", label: "Địa danh / Vị trí", type: "text" },
      { key: "region", label: "Quốc gia / Khu vực (tùy chọn)", type: "text" },
      { key: "scene", label: "Mô tả tổng quát", type: "text" },
      { key: "background", label: "Phông nền", type: "text" },
      { key: "scale", label: "Quy mô cảnh", type: "select", optionGroup: "environment", options: ["Cận cảnh", "Không gian rộng", "Toàn cảnh"] },
    ],
  },
  {
    key: "camera",
    category: "character",
    number: 6,
    label: "Camera / Góc nhìn",
    shortLabel: "Camera / Góc nhìn",
    icon: "camera",
    fields: [
      { key: "shot", label: "Góc máy", type: "select", options: ["Close-up", "Medium Shot", "Full body", "Wide Shot"] },
      { key: "angle", label: "Góc nhìn", type: "select", options: ["Eye level", "Bird view", "Low angle", "Over shoulder"] },
      { key: "aspect_ratio", label: "Tỷ lệ khung hình", type: "select", options: ["16:9", "9:16", "1:1"] },
      { key: "motion", label: "Chuyển động", type: "select", options: ["Tĩnh", "Chuyển động nhẹ", "Hành động"] },
      { key: "depth_of_field", label: "Độ sâu trường ảnh", type: "select", optionGroup: "camera", options: ["Shallow DOF", "Deep DOF"] },
      { key: "focus", label: "Điểm lấy nét", type: "select", optionGroup: "camera", options: ["Nhân vật", "Đôi mắt", "Phong cảnh"] },
      { key: "composition", label: "Bố cục", type: "select", optionGroup: "camera", options: ["Centered composition", "Rule of thirds", "Leading lines"] },
    ],
  },
  {
    key: "lighting",
    category: "character",
    number: 7,
    label: "Ánh sáng (Lighting)",
    shortLabel: "Ánh sáng",
    icon: "sun",
    fields: [
      { key: "type", label: "", type: "select", options: ["Golden Hour", "Sunrise", "Sunset", "Soft Light", "Hard Light"] },
      { key: "direction", label: "Hướng sáng", type: "select", options: ["Từ phía sau & bên trái", "Từ phía trước", "Ánh sáng bên hông"] },
      { key: "intensity", label: "Cường độ", type: "select", options: ["Mạnh vừa", "Mềm", "Mạnh"] },
      { key: "source", label: "Nguồn sáng", type: "select", optionGroup: "lighting", options: ["Ánh sáng tự nhiên", "Ánh trăng", "Nến"] },
      { key: "temperature", label: "Nhiệt độ màu", type: "select", optionGroup: "lighting", options: ["Ấm", "Lạnh", "Trung tính"] },
      { key: "contrast", label: "Độ tương phản", type: "select", optionGroup: "lighting", options: ["Tương phản thấp", "Tương phản cao", "Cân bằng"] },
    ],
  },
  {
    key: "style",
    category: "character",
    number: 8,
    label: "Phong cách (Style)",
    shortLabel: "Phong cách",
    icon: "palette",
    fields: [
      { key: "style", label: "Phong cách", type: "select", options: ["Pixar / 3D Animation", "Realistic", "Photorealistic", "Fantasy", "Cinematic", "Anime"] },
      { key: "detail", label: "Độ chi tiết", type: "select", options: ["Cao", "Vừa", "Thấp"] },
      { key: "palette", label: "Bảng màu", type: "select", options: ["Ấm áp, tự nhiên", "Lạnh, tương phản", "Đơn sắc"] },
      { key: "reference", label: "Tham chiếu", type: "select", optionGroup: "style", options: ["Cinematic Realism", "Biblical Epic", "Soft Illustration"] },
      { key: "rendering", label: "Cách thể hiện", type: "select", optionGroup: "style", options: ["Detailed texture", "Matte Painting", "Clean render"] },
      { key: "texture", label: "Kết cấu", type: "select", optionGroup: "style", options: ["Da và vải chân thực", "Bề mặt mịn", "Nét vẽ thủ công"] },
      { key: "mood", label: "Tâm trạng hình ảnh", type: "text" },
    ],
  },
  {
    key: "quality",
    category: "character",
    number: 9,
    label: "Chất lượng (Quality)",
    shortLabel: "Chất lượng",
    icon: "diamond",
    fields: [
      { key: "resolution", label: "Độ phân giải", type: "select", options: ["8K", "4K", "2K"] },
      { key: "quality", label: "Chất lượng", type: "select", options: ["Ultra High Quality", "High Quality", "Masterpiece"] },
      { key: "negative", label: "Negative prompt (tùy chọn)", type: "text" },
      { key: "sharpness", label: "Độ sắc nét", type: "select", optionGroup: "quality", options: ["Sharp Focus", "Soft Focus", "Crisp details"] },
      { key: "hdr", label: "Dải tương phản", type: "select", optionGroup: "quality", options: ["High Dynamic Range", "HDR", "Natural range"] },
      { key: "render_engine", label: "Bộ máy render", type: "select", optionGroup: "quality", options: ["Global Illumination", "Ray Tracing", "Standard render"] },
      { key: "guidance", label: "Yêu cầu bổ sung", type: "text" },
    ],
  },
  {
    key: "character_details",
    category: "character",
    number: 2,
    label: "Chi tiết ngoại hình",
    shortLabel: "Chi tiết ngoại hình",
    icon: "person",
    fields: [
      { key: "hair_style", label: "Kiểu tóc", type: "text" },
      { key: "hair_color", label: "Màu tóc", type: "select", optionGroup: "character_details", options: ["Nâu", "Đen", "Vàng", "Bạc"] },
      { key: "beard", label: "Râu / Lông mặt", type: "select", optionGroup: "character_details", options: ["Không", "Râu ngắn", "Râu dài"] },
      { key: "eye_color", label: "Màu mắt", type: "text" },
      { key: "skin_tone", label: "Làn da", type: "select", optionGroup: "character_details", options: ["Rám nắng", "Sáng", "Nâu ấm", "Nhợt nhạt"] },
      { key: "distinctive_features", label: "Đặc điểm khác", type: "text" },
    ],
  },
  {
    key: "character_mood",
    category: "character",
    number: 3,
    label: "Góc nhìn & Thần thái",
    shortLabel: "Góc nhìn & Thần thái",
    icon: "person",
    fields: [
      { key: "character_pose", label: "Tư thế nhân vật", type: "text" },
      { key: "gaze", label: "Hướng nhìn", type: "select", optionGroup: "character_mood", options: ["Nhìn thẳng", "Nhìn xa xăm", "Nhìn sang trái", "Nhìn xuống"] },
      { key: "character_mood", label: "Thần thái", type: "select", optionGroup: "character_mood", options: ["Quyết tâm", "Bình tĩnh", "Buồn bã", "Hy vọng"] },
      { key: "head_direction", label: "Hướng đầu", type: "select", optionGroup: "character_mood", options: ["Chính diện", "Nghiêng trái", "Nghiêng phải", "Quay nhẹ ra sau"] },
    ],
  },
  {
    key: "scenery_weather",
    category: "scenery",
    number: 3,
    label: "Thời tiết & Bầu trời",
    shortLabel: "Thời tiết & Bầu trời",
    icon: "sun",
    fields: [
      { key: "weather", label: "Thời tiết", type: "select", optionGroup: "environment", options: ["Trời quang", "Có mây", "Mưa nhẹ", "Sương mù"] },
      { key: "season", label: "Mùa", type: "select", optionGroup: "environment", options: ["Mùa xuân", "Mùa hè", "Mùa thu", "Mùa đông"] },
      { key: "atmosphere", label: "Không khí", type: "select", optionGroup: "environment", options: ["Không khí ấm áp", "Không khí lạnh", "Không khí huyền bí"] },
      { key: "clouds", label: "Mây", type: "select", optionGroup: "scenery_weather", options: ["Ít mây", "Mây nhẹ", "Mây dày", "Mây giông"] },
      { key: "special_phenomenon", label: "Hiện tượng đặc biệt", type: "text" },
      { key: "sky_color", label: "Màu sắc bầu trời", type: "text" },
      { key: "environment_light", label: "Ánh sáng tổng thể", type: "select", optionGroup: "scenery_weather", options: ["Ánh sáng ấm", "Ánh sáng lạnh", "Ánh sáng khuếch tán"] },
    ],
  },
  {
    key: "scenery_terrain",
    category: "scenery",
    number: 4,
    label: "Địa hình & Cảnh quan",
    shortLabel: "Địa hình & Cảnh quan",
    icon: "diamond",
    fields: [
      { key: "terrain", label: "Địa hình chính", type: "text" },
      { key: "vegetation", label: "Thảm thực vật", type: "text" },
      { key: "water", label: "Nước", type: "text" },
      { key: "landmark", label: "Chi tiết nổi bật", type: "text" },
    ],
  },
  {
    key: "scenery_style",
    category: "scenery",
    number: 5,
    label: "Phong cách & Bố cục",
    shortLabel: "Phong cách & Bố cục",
    icon: "palette",
    fields: [
      { key: "scenery_style", label: "Phong cách", type: "select", optionGroup: "scenery_style", options: ["Realistic (Hiện thực)", "Cinematic", "Fantasy", "Matte Painting"] },
      { key: "scenery_composition", label: "Góc nhìn / Bố cục", type: "select", optionGroup: "scenery_style", options: ["Toàn cảnh rộng", "Góc thấp", "Góc cao", "Đường dẫn thị giác"] },
      { key: "scenery_ratio", label: "Tỷ lệ khung hình", type: "select", optionGroup: "scenery_style", options: ["16:9", "9:16", "1:1", "4:3"] },
      { key: "scenery_palette", label: "Bảng màu", type: "text" },
      { key: "scenery_detail", label: "Mức độ chi tiết", type: "select", optionGroup: "scenery_style", options: ["Cao", "Vừa", "Thấp"] },
    ],
  },
  {
    key: "scenery_other",
    category: "scenery",
    number: 6,
    label: "Khác",
    shortLabel: "Khác",
    icon: "spark",
    fields: [
      { key: "scenery_extra", label: "Yếu tố bổ sung", type: "text" },
      { key: "scenery_note", label: "Ghi chú (tùy chọn)", type: "text" },
    ],
  },
  {
    key: "action_type",
    category: "action",
    number: 1,
    label: "Loại hành động",
    shortLabel: "Loại hành động",
    icon: "folder",
    fields: [
      { key: "action_type", label: "Chọn loại hành động", type: "select", optionGroup: "action_type", options: ["Chiến đấu", "Chạy", "Nhảy", "Tương tác", "Biểu diễn"] },
      { key: "action_intensity", label: "Cường độ hành động", type: "select", optionGroup: "action_type", options: ["Thấp", "Vừa", "Cao", "Cực cao"] },
    ],
  },
  {
    key: "action_main",
    category: "action",
    number: 2,
    label: "Mô tả hành động chính",
    shortLabel: "Mô tả hành động chính",
    icon: "json",
    fields: [
      { key: "main_action", label: "Hành động chính", type: "text" },
      { key: "action_details", label: "Chi tiết hành động", type: "text" },
      { key: "action_result", label: "Kết quả / Tác động", type: "text" },
    ],
  },
  {
    key: "action_poses",
    category: "action",
    number: 3,
    label: "Tư thế & Biểu cảm",
    shortLabel: "Tư thế & Biểu cảm",
    icon: "person",
    fields: [
      { key: "character_pose", label: "Tư thế nhân vật", type: "text" },
      { key: "character_expression", label: "Biểu cảm nhân vật", type: "text" },
      { key: "target_pose", label: "Tư thế đối tượng / Kẻ địch", type: "text" },
      { key: "target_expression", label: "Biểu cảm đối tượng / Kẻ địch", type: "text" },
    ],
  },
  {
    key: "action_direction",
    category: "action",
    number: 4,
    label: "Hướng chuyển động",
    shortLabel: "Hướng chuyển động",
    icon: "arrow",
    fields: [
      { key: "character_direction", label: "Hướng của nhân vật", type: "select", optionGroup: "action_direction", options: ["Từ trái sang phải", "Từ phải sang trái", "Tiến về phía trước"] },
      { key: "target_direction", label: "Hướng của đối tượng / Kẻ địch", type: "select", optionGroup: "action_direction", options: ["Đổ ngã về phía sau", "Tiến lại gần", "Bỏ chạy"] },
      { key: "action_camera", label: "Góc máy theo chuyển động", type: "select", optionGroup: "action_direction", options: ["Theo hướng hành động (tracking shot)", "Pan theo chủ thể", "Góc máy cố định"] },
    ],
  },
  {
    key: "action_timing",
    category: "action",
    number: 5,
    label: "Thời điểm của hành động",
    shortLabel: "Thời điểm của hành động",
    icon: "sun",
    fields: [
      { key: "action_start", label: "Thời điểm bắt đầu", type: "select", optionGroup: "action_timing", options: ["Khoảnh khắc kéo ná", "Chuẩn bị ra đòn", "Lấy đà"] },
      { key: "action_peak", label: "Thời điểm cao trào", type: "select", optionGroup: "action_timing", options: ["Viên đá rời ná", "Khoảnh khắc va chạm", "Đòn đánh mạnh nhất"] },
      { key: "action_end", label: "Thời điểm kết thúc", type: "select", optionGroup: "action_timing", options: ["Goliát ngã xuống", "Đối tượng lùi lại", "Bụi tan dần"] },
    ],
  },
  {
    key: "action_prop",
    category: "action",
    number: 6,
    label: "Vũ khí / Công cụ",
    shortLabel: "Vũ khí / Công cụ",
    icon: "sword",
    fields: [
      { key: "action_prop", label: "Vũ khí / Công cụ sử dụng", type: "text" },
      { key: "prop_hand", label: "Vị trí sử dụng", type: "select", optionGroup: "action_prop", options: ["Tay phải", "Tay trái", "Hai tay"] },
      { key: "prop_description", label: "Mô tả thêm (tùy chọn)", type: "text" },
    ],
  },
  {
    key: "action_effects",
    category: "action",
    number: 7,
    label: "Hiệu ứng bổ sung",
    shortLabel: "Hiệu ứng bổ sung",
    icon: "spark",
    fields: [
      { key: "motion_effect", label: "Hiệu ứng chuyển động", type: "select", optionGroup: "action_effects", options: ["Làm mờ chuyển động nhẹ", "Vệt chuyển động rõ", "Không hiệu ứng"] },
      { key: "impact_effect", label: "Hiệu ứng va chạm", type: "select", optionGroup: "action_effects", options: ["Bụi bay khi va chạm", "Tia sáng", "Mảnh vỡ", "Không có"] },
      { key: "sound_effect", label: "Hiệu ứng âm thanh (gợi ý)", type: "text" },
    ],
  },
  {
    key: "action_other",
    category: "action",
    number: 8,
    label: "Khác",
    shortLabel: "Khác",
    icon: "diamond",
    fields: [
      { key: "action_lighting", label: "Yếu tố bổ sung", type: "text" },
      { key: "action_note", label: "Ghi chú (tùy chọn)", type: "text" },
    ],
  },
];

const defaultForm: Record<string, string> = {
  name: "David",
  age: "Thiếu niên",
  gender: "Nam",
  appearance: "Tóc xoăn nâu, mặt nâu, khuôn mặt hiền hậu, làn da rám nắng",
  expression: "Quyết tâm, nhìn xa xăm, đứng vững",
  pose: "Đứng vững, tay cầm ná, hơi nghiêng về phía trước",
  ethnicity: "Dân tộc: Do Thái",
  profession: "Nghề nghiệp: Người chăn chiên",
  role: "Vai trò: Nhân vật chính",
  hair: "Tóc xoăn nâu",
  eyes: "Mắt nâu",
  outfit: "Áo choàng chăn chiên truyền thống",
  color: "Nâu đất, be",
  accessories: "Túi da nhỏ đeo bên hông",
  clothing_material: "Da thuộc",
  clothing_condition: "Cũ, sờn",
  outerwear: "Áo choàng len",
  footwear: "Sandals da",
  headwear: "Khăn trùm đầu",
  gloves: "Không có",
  jewelry: "Không có",
  item: "Ná (sling)",
  description: "Ná da, dây thừng bện",
  secondary_item: "Túi da nhỏ",
  weapon_material: "Da thuộc",
  weapon_condition: "Cũ, trầy xước",
  details: "Dây da bện, tay cầm vừa vặn",
  count: "1",
  location: "Thung lũng đá",
  time: "Hoàng hôn",
  weather: "Trời quang",
  scene: "Đồi đá, bụi cây khô, xa xa là những ngọn đồi",
  season: "Mùa thu",
  atmosphere: "Không khí ấm áp",
  background: "Những dãy núi mờ ở đường chân trời",
  scale: "Không gian rộng",
  shot: "Medium Shot",
  angle: "Eye level",
  aspect_ratio: "16:9",
  motion: "Tĩnh",
  depth_of_field: "Shallow DOF",
  focus: "Đôi mắt",
  composition: "Rule of thirds",
  type: "Golden Hour",
  direction: "Từ phía sau & bên trái",
  intensity: "Mạnh vừa",
  source: "Ánh sáng tự nhiên",
  temperature: "Ấm",
  contrast: "Tương phản thấp",
  style: "Pixar / 3D Animation",
  detail: "Cao",
  palette: "Ấm áp, tự nhiên",
  reference: "Cinematic Realism",
  rendering: "Detailed texture",
  texture: "Da và vải chân thực",
  mood: "Hùng tráng, chân thành, giàu hy vọng",
  resolution: "8K",
  quality: "Ultra High Quality",
  negative: "blur, low quality, bad anatomy, watermark, text",
  sharpness: "Sharp Focus",
  hdr: "High Dynamic Range",
  render_engine: "Global Illumination",
  guidance: "Không chữ, không logo, giữ đúng tỷ lệ cơ thể",
  hair_style: "Tóc xoăn ngắn",
  hair_color: "Nâu",
  beard: "Không",
  eye_color: "Nâu",
  skin_tone: "Rám nắng",
  distinctive_features: "Không có sẹo, dáng người mảnh mai",
  gaze: "Nhìn xa xăm",
  character_mood: "Quyết tâm",
  head_direction: "Chính diện",
  scene_type: "Phong cảnh thiên nhiên",
  region: "Do Thái",
  clouds: "Ít mây",
  special_phenomenon: "Không có",
  sky_color: "Cam, vàng, hồng phạt",
  environment_light: "Ánh sáng ấm",
  terrain: "Vách núi đá, thung lũng",
  vegetation: "Cây bụi, cỏ khô, vài cây nhỏ",
  water: "Dòng suối nhỏ",
  landmark: "Những tảng đá lớn, con đường mòn ven suối",
  scenery_style: "Realistic (Hiện thực)",
  scenery_composition: "Toàn cảnh rộng",
  scenery_ratio: "16:9",
  scenery_palette: "Vàng cam, nâu đất, xanh olive",
  scenery_detail: "Cao",
  scenery_extra: "Không có người, không công trình",
  scenery_note: "Tạo cảm giác yên bình, hùng vĩ",
  action_type: "Chiến đấu",
  action_intensity: "Cao",
  main_action: "David dùng ná bắn đá vào trán Goliát.",
  action_details: "David xoay ná, thả viên đá với lực mạnh và chính xác.",
  action_result: "Goliát ngã xuống, David giành chiến thắng.",
  character_pose: "Đứng vững, tay giương ná",
  character_expression: "Tập trung, quyết tâm",
  target_pose: "Ngã ngửa về phía sau",
  target_expression: "Ngạc nhiên, đau đớn",
  character_direction: "Từ trái sang phải",
  target_direction: "Đổ ngã về phía sau",
  action_camera: "Theo hướng hành động (tracking shot)",
  action_start: "Khoảnh khắc kéo ná",
  action_peak: "Viên đá rời ná",
  action_end: "Goliát ngã xuống",
  action_prop: "Ná và đá",
  prop_hand: "Tay phải",
  prop_description: "Viên đá tròn, kích thước vừa tay",
  motion_effect: "Làm mờ chuyển động nhẹ",
  impact_effect: "Bụi bay khi Goliát ngã",
  sound_effect: "Âm gió xé, tiếng va đập mạnh",
  action_lighting: "Ánh sáng mạnh từ phía sau David",
  action_note: "Nhấn mạnh sự tương phản giữa yếu và mạnh",
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

const expandedOptionLists: Record<string, string[]> = {
  subject: [...optionLists.subject, "Dân tộc: Do Thái", "Dân tộc: La Mã", "Dân tộc: Trung Đông", "Nghề nghiệp: Người chăn chiên", "Nghề nghiệp: Chiến binh", "Nghề nghiệp: Vua", "Vai trò: Nhân vật chính", "Vai trò: Nhân vật phụ", "Vai trò: Nhân vật nền", "Tóc xoăn nâu", "Tóc dài đen", "Tóc ngắn vàng", "Mắt nâu", "Mắt xanh", "Mắt đen"],
  clothing: [...optionLists.clothing, "Áo choàng len", "Áo giáp da", "Áo vải lanh", "Quần nâu", "Sandals da", "Giày da", "Chân trần", "Khăn trùm đầu", "Mũ vải", "Găng tay da", "Găng tay vải", "Không có", "Bạc", "Vàng", "Da thuộc", "Vải thô", "Len", "Cũ, sờn", "Mới, sạch", "Trang trọng"],
  weapon_prop: [...optionLists.weapon_prop, "Ná da", "Kiếm đồng", "Khiên gỗ", "Gậy gỗ", "Đá cuội", "Dây thừng", "Da thuộc", "Gỗ sồi", "Kim loại", "Cũ, trầy xước", "Mới tinh", "Đã sử dụng"],
  environment: [...optionLists.environment, "Phong cảnh thiên nhiên", "Thành phố", "Nội thất", "Làng cổ", "Thung lũng đá", "Đồng bằng", "Con đường núi", "Mùa xuân", "Mùa hè", "Mùa thu", "Mùa đông", "Trời quang", "Nhiều mây", "Sương mù", "Không khí ấm áp", "Không khí lạnh", "Không khí huyền bí", "Cận cảnh", "Không gian rộng", "Toàn cảnh"],
  camera: [...optionLists.camera, "Extreme Close-up", "Medium Shot", "Full Shot", "Top-down", "Three-quarter view", "Shallow DOF", "Deep DOF", "Nhân vật", "Đôi mắt", "Phong cảnh", "Centered composition", "Rule of thirds", "Leading lines"],
  lighting: [...optionLists.lighting, "Warm sunlight", "Cool moonlight", "Backlight", "Side light", "Low contrast", "High contrast", "Cân bằng", "Ánh sáng tự nhiên", "Ánh trăng", "Nến", "Ấm", "Lạnh", "Trung tính"],
  style: [...optionLists.style, "Pixar / 3D Animation", "Dark Fantasy", "Biblical Epic", "Cinematic Realism", "Soft Illustration", "Matte Painting", "Detailed texture", "Clean render", "Da và vải chân thực", "Bề mặt mịn", "Nét vẽ thủ công"],
  quality: [...optionLists.quality, "Ultra High Quality", "High Dynamic Range", "Natural range", "Crisp details", "Soft Focus", "Standard render", "Không chữ", "Không logo", "Giữ đúng tỷ lệ cơ thể"],
  character_details: ["Nâu", "Đen", "Vàng", "Bạc", "Không", "Râu ngắn", "Râu dài", "Rám nắng", "Sáng", "Nâu ấm", "Nhợt nhạt"],
  character_mood: ["Nhìn thẳng", "Nhìn xa xăm", "Nhìn sang trái", "Nhìn xuống", "Quyết tâm", "Bình tĩnh", "Buồn bã", "Hy vọng", "Chính diện", "Nghiêng trái", "Nghiêng phải", "Quay nhẹ ra sau"],
  scenery_weather: ["Ít mây", "Mây nhẹ", "Mây dày", "Mây giông", "Ánh sáng ấm", "Ánh sáng lạnh", "Ánh sáng khuếch tán"],
  scenery_style: ["Realistic (Hiện thực)", "Cinematic", "Fantasy", "Matte Painting", "Toàn cảnh rộng", "Góc thấp", "Góc cao", "Đường dẫn thị giác", "16:9", "9:16", "1:1", "4:3", "Cao", "Vừa", "Thấp"],
  action_type: ["Chiến đấu", "Chạy", "Nhảy", "Tương tác", "Biểu diễn", "Thấp", "Vừa", "Cao", "Cực cao"],
  action_direction: ["Từ trái sang phải", "Từ phải sang trái", "Tiến về phía trước", "Đổ ngã về phía sau", "Tiến lại gần", "Bỏ chạy", "Theo hướng hành động (tracking shot)", "Pan theo chủ thể", "Góc máy cố định"],
  action_timing: ["Khoảnh khắc kéo ná", "Chuẩn bị ra đòn", "Lấy đà", "Viên đá rời ná", "Khoảnh khắc va chạm", "Đòn đánh mạnh nhất", "Goliát ngã xuống", "Đối tượng lùi lại", "Bụi tan dần"],
  action_prop: ["Tay phải", "Tay trái", "Hai tay"],
  action_effects: ["Làm mờ chuyển động nhẹ", "Vệt chuyển động rõ", "Không hiệu ứng", "Bụi bay khi va chạm", "Tia sáng", "Mảnh vỡ", "Không có"],
};

const promptCategories: { key: PromptCategory; label: string; icon: IconName }[] = [
  { key: "character", label: "Tạo nhân vật", icon: "person" },
  { key: "scenery", label: "Tạo cảnh vật", icon: "image" },
  { key: "action", label: "Tạo hành động", icon: "workflow" },
];

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
  image: ImageIcon,
  workflow: Workflow,
  shirt: Shirt,
  sword: Swords,
  camera: Camera,
  sun: Sun,
  moon: Moon,
  palette: Palette,
  diamond: Diamond,
  grip: GripVertical,
  bulb: Lightbulb,
  cloud: Cloud,
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

function CloudSyncDialog({ config, syncState, onClose, onSaveAndSync }: { config: CloudSyncConfig; syncState: CloudSyncState; onClose: () => void; onSaveAndSync: (config: CloudSyncConfig) => void }) {
  const isBusy = syncState === "saving" || syncState === "loading";
  return (
    <div className="sync-backdrop" role="presentation">
      <div className="sync-dialog" role="dialog" aria-modal="true" aria-labelledby="sync-dialog-title">
        <div className="panel-heading"><h2 id="sync-dialog-title"><Icon name="cloud" size={20} /> Google Sheet</h2><button className="dialog-close" onClick={onClose} aria-label="Đóng">×</button></div>
        <p className="sync-description">Chế độ công khai đã bật. Website sẽ tự động đọc và đồng bộ dữ liệu với Google Sheet mà không cần nhập API Token.</p>
        <div className="sync-public-url"><span>Apps Script Web App</span><code>{config.apiUrl}</code></div>
        <div className="sync-dialog-actions"><button className="outline-button" onClick={onClose} disabled={isBusy}>Đóng</button><button className="primary-button" onClick={() => onSaveAndSync(config)} disabled={isBusy}><Icon name="cloud" size={18} />{isBusy ? "Đang đồng bộ..." : "Đồng bộ ngay"}</button></div>
      </div>
    </div>
  );
  /*
  const isBusy = syncState === "saving" || syncState === "loading";
  return (
    <div className="sync-backdrop" role="presentation">
      <div className="sync-dialog" role="dialog" aria-modal="true" aria-labelledby="sync-dialog-title">
        <div className="panel-heading"><h2 id="sync-dialog-title"><Icon name="cloud" size={20} /> Google Sheet</h2><button className="dialog-close" onClick={onClose} aria-label="Đóng">×</button></div>
        <p className="sync-description">Nhập URL Web App và API Token đã tạo trong Google Apps Script. Token chỉ được lưu trên trình duyệt này.</p>
        <label className="sync-field"><span>URL Apps Script Web App</span><input value={draft.apiUrl} onChange={(event) => setDraft((current) => ({ ...current, apiUrl: event.target.value }))} placeholder="https://script.google.com/macros/s/.../exec" /></label>
        <label className="sync-field"><span>API Token</span><input type="password" value={draft.token} onChange={(event) => setDraft((current) => ({ ...current, token: event.target.value }))} placeholder="Nhập API Token trong Apps Script" /></label>
        <div className="sync-dialog-actions"><button className="outline-button" onClick={onClose} disabled={isBusy}>Hủy</button><button className="primary-button" onClick={() => onSaveAndSync(draft)} disabled={isBusy || !draft.apiUrl.trim() || !draft.token.trim()}><Icon name="cloud" size={18} />{isBusy ? "Đang đồng bộ..." : "Lưu và đồng bộ"}</button></div>
      </div>
    </div>
  );
  */
}

function Sidebar({ screen, onNavigate, activeCategory, onCategoryChange }: { screen: Screen; onNavigate: (screen: Screen) => void; activeCategory: PromptCategory; onCategoryChange: (category: PromptCategory) => void }) {
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
          {nav.map((item) => <div className="nav-group" key={item.key}>
            <button className={`nav-item ${screen === item.key ? "selected" : ""}`} onClick={() => onNavigate(item.key)}><Icon name={item.icon} size={20} /><span>{item.label}</span></button>
            {item.key === "create" && screen === "create" && <div className="category-subnav" role="tablist" aria-label="Category tạo prompt">{promptCategories.map((category) => <button key={category.key} className={activeCategory === category.key ? "active" : ""} role="tab" aria-selected={activeCategory === category.key} onClick={() => { onNavigate("create"); onCategoryChange(category.key); }}><Icon name={category.icon} size={17} /><span>{category.label}</span></button>)}</div>}
          </div>)}
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

function Toolbar({ onImport, onSave, onSaveToCloud, onClear, onSync, syncState }: { onImport: (event: ChangeEvent<HTMLInputElement>) => void; onSave: () => void; onSaveToCloud: () => void; onClear: () => void; onSync: () => void; syncState: CloudSyncState }) {
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
    <div className="topbar no-stepper">
      <div className="top-actions">
        <button className="outline-button" onClick={() => fileRef.current?.click()}><Icon name="folder" size={19} />Mở file JSON</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        <button className="outline-button sync-button" onClick={onSync} disabled={syncState === "saving" || syncState === "loading"}><Icon name="cloud" size={19} />{syncState === "loading" ? "Đang tải..." : "Google Sheet"}</button>
        <button className="outline-button cloud-save-button" onClick={onSaveToCloud} disabled={syncState === "saving" || syncState === "loading"}><Icon name="cloud" size={19} />{syncState === "saving" ? "Đang lưu..." : "Lưu"}</button>
        <button className="outline-button" onClick={onSave}><Icon name="library" size={19} />Lưu prompt</button>
        <button className="outline-button danger" onClick={onClear}><Icon name="trash" size={18} />Xóa tất cả</button>
        <button className="theme-toggle" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
      </div>
    </div>
  );
}

function Field({ config, value, onChange, settingsOptions }: { config: FieldConfig; value: string; onChange: (value: string) => void; settingsOptions: Record<string, string[]> }) {
  const selectOptions = config.optionGroup ? settingsOptions[config.optionGroup] || config.options || [] : config.options || [];
  const selectedValue = value || "";
  const [isOpen, setIsOpen] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const comboRef = useRef<HTMLSpanElement>(null);
  const visibleOptions = selectOptions.filter((option) => showAllOptions || !value || option.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!comboRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);
  const chooseOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setShowAllOptions(false);
  };
  return (
    <label className="field">
      {config.label && <span className="field-label">{config.label}</span>}
      {config.type === "select" ? (
        <span ref={comboRef} className={`select-wrap editable-select ${isOpen ? "open" : ""}`}>
          <input value={selectedValue} placeholder={config.placeholder || "Chọn hoặc nhập..."} onFocus={() => { setIsOpen(true); setShowAllOptions(true); }} onClick={() => { setIsOpen(true); setShowAllOptions(true); }} onChange={(event) => { onChange(event.target.value); setIsOpen(true); setShowAllOptions(false); }} onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false); }} aria-label={config.label || "Thông tin prompt"} aria-expanded={isOpen} aria-haspopup="listbox" />
          <button type="button" className="select-trigger" aria-label="Mở danh sách tùy chọn" aria-expanded={isOpen} onMouseDown={(event) => event.preventDefault()} onClick={() => { setIsOpen((current) => !current); setShowAllOptions(true); }}><Icon name="chevron" size={15} /></button>
          {isOpen && <div className="select-menu" role="listbox"><button type="button" className={`select-option ${!value ? "active" : ""}`} role="option" aria-selected={!value} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseOption("")}>Để trống</button>{visibleOptions.length ? visibleOptions.map((option) => <button type="button" className={`select-option ${option === value ? "active" : ""}`} role="option" aria-selected={option === value} key={option} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseOption(option)}>{option}</button>) : <span className="select-empty">Không có tùy chọn phù hợp</span>}</div>}
        </span>
      ) : <input value={value} placeholder={config.placeholder} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function GroupForm({ group, form, onUpdate, settingsOptions }: { group: Group; form: Record<string, string>; onUpdate: (key: string, value: string) => void; settingsOptions: Record<string, string[]> }) {
  return (
    <section className="form-group">
      <h3><Icon name={group.icon} size={20} /><span className="group-index">{group.number}.</span>{group.label}</h3>
      <div className={`field-grid fields-${group.fields.length}`}>
        {group.fields.map((field) => <Field key={field.key} config={field} settingsOptions={settingsOptions} value={form[field.key] || ""} onChange={(value) => onUpdate(field.key, value)} />)}
      </div>
    </section>
  );
}

function makePrompt(form: Record<string, string>, category: PromptCategory | "all" = "all") {
  if (category === "all") return [makePrompt(form, "character"), makePrompt(form, "scenery"), makePrompt(form, "action")].join(" ");

  if (category === "character") {
    const character = `Character: ${form.name || "a character"}, ${form.age || "young"}, ${form.gender || "unspecified"}; ${form.appearance || "distinctive appearance"}, ${form.expression || "expressive mood"}, ${form.pose || "natural pose"}. ${form.hair_style || form.hair || "distinctive hair"}, ${form.eye_color || form.eyes || "expressive eyes"}, ${form.skin_tone || "natural skin"}.`;
    const clothing = `Clothing: ${form.outfit || "detailed clothing"} in ${form.color || "natural colors"}, ${form.clothing_material || "authentic materials"}, ${form.clothing_condition || "well cared for"}; ${form.outerwear || "layered outerwear"}, ${form.footwear || "practical footwear"}, ${form.accessories || "subtle accessories"}.`;
    const prop = form.item || form.description || form.secondary_item ? `Prop: ${form.item || "a meaningful prop"}${form.secondary_item ? `, with ${form.secondary_item}` : ""}. ${form.description || form.details || "Visible handcrafted details"}.` : "";
    const camera = `Camera: ${form.shot || "Medium shot"}, ${form.angle || "eye level"}, ${form.aspect_ratio || "16:9"}, ${form.motion || "static"}, ${form.depth_of_field || "shallow depth of field"}, ${form.focus || "clear subject focus"}, ${form.composition || "balanced composition"}.`;
    const lighting = `Lighting: ${form.type || "soft light"}, ${form.direction || "directional lighting"}, ${form.intensity || "moderate intensity"}, ${form.source || "natural source"}, ${form.temperature || "warm color temperature"}, ${form.contrast || "balanced contrast"}.`;
    const style = `Style: ${form.style || "cinematic style"}, ${form.reference || "cinematic reference"}, ${form.rendering || "detailed rendering"}, ${form.texture || "rich textures"}, ${form.mood || "evocative mood"}.`;
    const quality = `Quality: ${form.detail || "high detail"}, ${form.resolution || "8K"}, ${form.quality || "high quality"}, ${form.sharpness || "sharp focus"}, ${form.hdr || "high dynamic range"}, ${form.render_engine || "advanced rendering"}.${form.negative ? ` Avoid ${form.negative}.` : ""} ${form.guidance || ""}`;
    return `${character} ${clothing} ${prop} ${camera} ${lighting} ${style} ${quality}`.trim();
  }

  if (category === "scenery") {
    const scenery = `Scenery: ${form.scene_type || "a natural landscape"} at ${form.location || "a cinematic environment"}${form.region ? `, ${form.region}` : ""}, during ${form.time || "golden hour"}. ${form.scene || "Layered environmental details"}, ${form.background || "distant background"}, ${form.scale || "wide space"}.`;
    const weather = `Weather: ${form.weather || "atmospheric weather"}, ${form.season || "a beautiful season"}, ${form.atmosphere || "rich atmosphere"}, ${form.clouds || "soft clouds"}, ${form.sky_color || "a colorful sky"}${form.special_phenomenon ? `, ${form.special_phenomenon}` : ""}.`;
    const terrain = `Landscape: ${form.terrain || "layered terrain"}, ${form.vegetation || "natural vegetation"}, ${form.water || "subtle water details"}, ${form.landmark || "distinctive landmarks"}.`;
    const style = `Style: ${form.scenery_style || "cinematic scenery"}, ${form.scenery_composition || "balanced composition"}, ${form.scenery_ratio || "16:9"}, ${form.scenery_palette || "natural colors"}, ${form.scenery_detail || "high detail"}, ${form.environment_light || "soft ambient light"}.`;
    const extra = [form.scenery_extra, form.scenery_note].filter(Boolean).join(". ");
    return `${scenery} ${weather} ${terrain} ${style}${extra ? ` Additional details: ${extra}.` : ""}`.trim();
  }

  const action = `Action: ${form.main_action || "a dynamic movement"}${form.action_details ? `, ${form.action_details}` : ""}${form.action_result ? `, resulting in ${form.action_result}` : ""}. ${form.action_type || "subtle movement"}, ${form.action_intensity || "moderate intensity"}.`;
  const poses = `Poses and expressions: ${form.character_pose || "a clear character pose"}, ${form.character_expression || "focused expression"}; ${form.target_pose || "responsive target pose"}, ${form.target_expression || "visible target reaction"}.`;
  const direction = `Movement: ${form.character_direction || "natural direction"}, ${form.target_direction || "responsive movement"}, ${form.action_camera || "cinematic tracking shot"}.`;
  const timing = `Timing: from ${form.action_start || "the beginning"} to ${form.action_peak || "the climax"}, ending with ${form.action_end || "a clear resolution"}.`;
  const prop = form.action_prop || form.prop_description ? `Tool: ${form.action_prop || "a supporting tool"}, ${form.prop_hand || "used naturally"}. ${form.prop_description || ""}` : "";
  const effects = `Effects: ${form.motion_effect || "natural motion"}, ${form.impact_effect || "subtle impact"}${form.sound_effect ? `, ${form.sound_effect}` : ""}.`;
  const extra = [form.action_lighting, form.action_note].filter(Boolean).join(". ");
  return `${action} ${poses} ${direction} ${timing} ${prop} ${effects}${extra ? ` Additional details: ${extra}.` : ""}`.trim();
}

function makeJson(form: Record<string, string>) {
  return {
    subject: { name: form.name, age: form.age, gender: form.gender, appearance: form.appearance, expression: form.expression, pose: form.pose, ethnicity: form.ethnicity, profession: form.profession, role: form.role, hair: form.hair, eyes: form.eyes },
    character_details: { hair_style: form.hair_style, hair_color: form.hair_color, beard: form.beard, eye_color: form.eye_color, skin_tone: form.skin_tone, distinctive_features: form.distinctive_features },
    character_mood: { pose: form.character_pose, gaze: form.gaze, mood: form.character_mood, head_direction: form.head_direction },
    clothing: { outfit: form.outfit, color: form.color, accessories: form.accessories, material: form.clothing_material, condition: form.clothing_condition, outerwear: form.outerwear, footwear: form.footwear, headwear: form.headwear, gloves: form.gloves, jewelry: form.jewelry },
    weapon_prop: { item: form.item, description: form.description, secondary_item: form.secondary_item, material: form.weapon_material, condition: form.weapon_condition, details: form.details, count: form.count },
    environment: { location: form.location, region: form.region, type: form.scene_type, time: form.time, weather: form.weather, description: form.scene, season: form.season, atmosphere: form.atmosphere, background: form.background, scale: form.scale },
    scenery_weather: { weather: form.weather, clouds: form.clouds, sky_color: form.sky_color, special_phenomenon: form.special_phenomenon, light: form.environment_light },
    terrain: { main: form.terrain, vegetation: form.vegetation, water: form.water, highlights: form.landmark },
    scenery_style: { style: form.scenery_style, composition: form.scenery_composition, aspect_ratio: form.scenery_ratio, palette: form.scenery_palette, detail: form.scenery_detail },
    scenery_other: { extra: form.scenery_extra, note: form.scenery_note },
    camera: { shot: form.shot, angle: form.angle, aspect_ratio: form.aspect_ratio, motion: form.motion, depth_of_field: form.depth_of_field, focus: form.focus, composition: form.composition },
    lighting: { type: form.type, direction: form.direction, intensity: form.intensity, source: form.source, temperature: form.temperature, contrast: form.contrast },
    style: { style: form.style, detail: form.detail, palette: form.palette, reference: form.reference, rendering: form.rendering, texture: form.texture, mood: form.mood },
    quality: { resolution: form.resolution, quality: form.quality, negative_prompt: form.negative, sharpness: form.sharpness, hdr: form.hdr, render_engine: form.render_engine, guidance: form.guidance },
    action: { type: form.action_type, intensity: form.action_intensity, main_action: form.main_action, details: form.action_details, result: form.action_result },
    poses: { character_pose: form.character_pose, character_expression: form.character_expression, target_pose: form.target_pose, target_expression: form.target_expression },
    movement_direction: { character: form.character_direction, target: form.target_direction, camera_follow: form.action_camera },
    timing: { start: form.action_start, climax: form.action_peak, end: form.action_end },
    action_prop: { item: form.action_prop, hand: form.prop_hand, description: form.prop_description },
    action_effects: { motion: form.motion_effect, impact: form.impact_effect, sound: form.sound_effect },
    action_other: { lighting: form.action_lighting, note: form.action_note },
  };
}

function JsonPreview({ form, full = false }: { form: Record<string, string>; full?: boolean }) {
  const json = JSON.stringify(makeJson(form), null, 2);
  return <div className={`json-code ${full ? "full" : ""}`}><pre>{json}</pre></div>;
}

function CreateView({ form, onUpdate, prompts, onNavigate, onSelectPrompt, configuredGroups, settingsOptions, activeCategory }: { form: Record<string, string>; onUpdate: (key: string, value: string) => void; prompts: PromptRecord[]; onNavigate: (screen: Screen) => void; onSelectPrompt: (prompt: PromptRecord) => void; configuredGroups: Group[]; settingsOptions: Record<string, string[]>; activeCategory: PromptCategory }) {
  const [promptDraft, setPromptDraft] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const imageKey = `image_url_${activeCategory}`;
  const imageUrl = form[imageKey] || (activeCategory === "character" ? form.image_url || "" : "");
  const createPrompt = () => setPromptDraft(makePrompt(form, activeCategory));
  const clearPrompt = () => setPromptDraft("");
  useEffect(() => setImageLoadError(false), [imageUrl]);
  const categoryGroups = configuredGroups.filter((group) => (group.category || "character") === activeCategory).sort((a, b) => a.number - b.number);
  return (
    <div className="create-layout">
      <div className="panel form-panel">
        <div className="panel-heading"><h2>THÔNG TIN PROMPT</h2></div>
        <div className="form-scroll">{categoryGroups.map((group) => <GroupForm key={group.key} group={group} form={form} onUpdate={onUpdate} settingsOptions={settingsOptions} />)}</div>
      </div>
      <div className="create-right">
        <div className="panel preview-prompt">
          <div className="panel-heading"><h2>PREVIEW PROMPT <small>(sau khi sinh)</small></h2></div>
          <textarea className="prompt-text prompt-textarea" aria-label="Preview prompt có thể chỉnh sửa" value={promptDraft} onChange={(event) => setPromptDraft(event.target.value)} placeholder="Bấm &quot;Tạo prompt&quot; để sinh prompt từ thông tin đã nhập" />
          <div className="char-count">Số ký tự: {promptDraft.length}</div>
          <div className="prompt-actions"><button className="primary-button small-button" onClick={createPrompt}><Icon name="spark" size={17} />Tạo prompt</button><button className="outline-button small-button danger" onClick={clearPrompt} disabled={!promptDraft}><Icon name="trash" size={17} />Xóa prompt</button></div>
        </div>
        <div className="panel image-panel">
          <div className="panel-heading"><h2>PREVIEW IMAGE</h2></div>
          <div className="image-preview-body">
            <div className="image-frame">{imageUrl && !imageLoadError ? <img src={imageUrl} alt="Preview hình ảnh của prompt" onError={() => setImageLoadError(true)} /> : <div className="image-placeholder">{imageLoadError ? "Không thể tải hình từ URL này" : "Nhập URL hình ảnh bên dưới để xem preview"}</div>}</div>
            <label className="image-url-field"><span>URL hình ảnh — {promptCategories.find((category) => category.key === activeCategory)?.label}</span><input className="image-url-input" type="url" value={imageUrl} onChange={(event) => onUpdate(imageKey, event.target.value)} placeholder="https://example.com/image.jpg" /></label>
          </div>
        </div>
        <div className="panel mini-library">
          <div className="panel-heading"><h2>THƯ VIỆN PROMPT</h2></div>
          <div className="library-mini-toolbar"><div className="searchbox"><Icon name="search" size={17} /><input placeholder="Tìm kiếm prompt..." /></div><select><option>Tất cả</option></select></div>
          <div className="mini-list">{prompts.slice(0, 3).map((prompt) => <div className="mini-prompt" key={prompt.id}><div><strong>{prompt.title}</strong><div className="tag-row"><span>{prompt.subject}</span><span>{prompt.style}</span><span>{prompt.ratio}</span></div></div><span className="mini-date">{prompt.created}</span><div className="row-actions"><button aria-label="Xem" onClick={() => onSelectPrompt(prompt)}><Icon name="eye" size={17} /></button><button aria-label="Sửa" onClick={() => onSelectPrompt(prompt)}><Icon name="edit" size={17} /></button><button aria-label="Sao chép"><Icon name="copy" size={17} /></button><button aria-label="Xóa" className="red-icon"><Icon name="trash" size={16} /></button></div></div>)}</div>
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
  const imageCategories = (["character", "scenery", "action"] as PromptCategory[]).filter((category) => prompt.imageUrls?.[category]);
  return <div className="detail-column"><div className="panel detail-panel"><div className="panel-heading"><h2>CHI TIẾT PROMPT</h2></div><h3>{prompt.title} <span className="ratio-pill">{prompt.ratio}</span></h3><div className="detail-meta"><span>Chủ đề: &nbsp;{prompt.topic}</span><span>Phong cách: &nbsp;{prompt.style}</span><span>Tạo lúc: &nbsp;{prompt.created}</span></div><strong>Mô tả ngắn</strong><p>{prompt.description}</p>{imageCategories.length > 0 && <div className="saved-images">{imageCategories.map((category) => { const imageUrl = prompt.imageUrls?.[category] || ""; const categoryLabel = promptCategories.find((item) => item.key === category)?.label || category; return <div className="saved-image" key={category}><strong className="saved-image-label">{categoryLabel}</strong><img src={imageUrl} alt={`Hình ảnh ${categoryLabel} của ${prompt.title}`} /><a href={imageUrl} target="_blank" rel="noreferrer">{imageUrl}</a></div>; })}</div>}</div><div className="panel detail-json"><div className="panel-heading heading-actions"><h2>XEM TRƯỚC JSON <span className="valid-pill">✓ Hợp lệ</span></h2><button className="primary-button small-button"><Icon name="copy" size={17} />Copy JSON</button></div><JsonPreview form={prompt.data} /></div><button className="panel edit-information"><Icon name="edit" size={18} />Chỉnh sửa thông tin</button></div>;
}

function SettingsView({ tab, setTab, category, setCategory, selectedGroup, setSelectedGroup, options, setOptions, fields, setFields }: { tab: SettingsTab; setTab: (tab: SettingsTab) => void; category: PromptCategory; setCategory: (category: PromptCategory) => void; selectedGroup: string; setSelectedGroup: (key: string) => void; options: Record<string, string[]>; setOptions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>; fields: Record<string, FieldConfig[]>; setFields: React.Dispatch<React.SetStateAction<Record<string, FieldConfig[]>>> }) {
  const visibleGroups = groups.filter((item) => (item.category || "character") === category).sort((a, b) => a.number - b.number);
  const group = visibleGroups.find((item) => item.key === selectedGroup) || visibleGroups[0] || groups[0];
  const activeOptions = options[group.key] || [];
  const activeFields = fields[group.key] || group.fields;
  const selectCategory = (nextCategory: PromptCategory) => { setCategory(nextCategory); const firstGroup = groups.find((item) => (item.category || "character") === nextCategory); if (firstGroup) setSelectedGroup(firstGroup.key); };
  const addOption = () => { const value = window.prompt("Tên tùy chọn mới"); if (value?.trim()) setOptions((current) => ({ ...current, [group.key]: [...(current[group.key] || []), value.trim()] })); };
  const editOption = (index: number) => { const value = window.prompt("Sửa tên tùy chọn", activeOptions[index]); if (value?.trim()) setOptions((current) => ({ ...current, [group.key]: (current[group.key] || []).map((item, itemIndex) => itemIndex === index ? value.trim() : item) })); };
  const deleteOption = (index: number) => setOptions((current) => ({ ...current, [group.key]: (current[group.key] || []).filter((_, itemIndex) => itemIndex !== index) }));
  const addField = () => { const value = window.prompt("Tên trường mới"); if (value?.trim()) setFields((current) => ({ ...current, [group.key]: [...(current[group.key] || group.fields), { key: `custom_${Date.now()}`, label: value.trim(), type: "text" }] })); };
  const editField = (index: number) => { const value = window.prompt("Sửa tên trường", activeFields[index]?.label); if (value?.trim()) setFields((current) => ({ ...current, [group.key]: activeFields.map((field, fieldIndex) => fieldIndex === index ? { ...field, label: value.trim() } : field) })); };
  return <div className="settings-view"><div className="settings-head"><div><h2>CÀI ĐẶT</h2><p>Quản lý danh sách tùy chọn và cấu trúc thông tin. Các thay đổi sẽ hiển thị trong mục &quot;Nhập &amp; tạo prompt&quot;.</p></div><div className="settings-category-tabs" role="tablist" aria-label="Category cài đặt">{promptCategories.map((item) => <button key={item.key} className={category === item.key ? "active" : ""} role="tab" aria-selected={category === item.key} onClick={() => selectCategory(item.key)}><Icon name={item.icon} size={17} />{item.label}</button>)}</div><div className="settings-tabs"><button className={tab === "options" ? "active" : ""} onClick={() => setTab("options")}>Quản lý tùy chọn</button><button className={tab === "fields" ? "active" : ""} onClick={() => setTab("fields")}>Quản lý trường thông tin</button></div></div><div className="settings-body"><div className="panel group-picker"><h3>CHỌN MỤC CẦN QUẢN LÝ</h3>{visibleGroups.map((item) => <button key={item.key} className={group.key === item.key ? "selected" : ""} onClick={() => setSelectedGroup(item.key)}><Icon name={item.icon} size={19} /><span>{item.number}. {item.label}</span></button>)}</div><div className="panel settings-table"><div className="settings-table-title"><div><h2>{tab === "options" ? "QUẢN LÝ TÙY CHỌN" : "QUẢN LÝ TRƯỜNG THÔNG TIN"}: {group.number}. {group.label.toUpperCase()}</h2><p>{tab === "options" ? "Thêm, sửa, xóa các tùy chọn của mục này." : "Thêm, sửa, xóa hoặc sắp xếp thứ tự các trường thông tin của mục này."}</p></div><button className="primary-button" onClick={tab === "options" ? addOption : addField}><Icon name="plus" size={23} />{tab === "options" ? "Thêm tùy chọn" : "Thêm trường"}</button></div>{tab === "options" ? <OptionsTable options={activeOptions} onEdit={editOption} onDelete={deleteOption} /> : <FieldsTable fields={activeFields} onEdit={editField} onDelete={(index) => setFields((current) => ({ ...current, [group.key]: activeFields.filter((_, itemIndex) => itemIndex !== index) }))} />}</div></div><p className="settings-note">* Các tùy chọn và trường thông tin bạn thêm/sửa sẽ được áp dụng ngay trong mục &quot;Nhập &amp; tạo prompt&quot;.</p></div>;
}

function OptionsTable({ options, onEdit, onDelete }: { options: string[]; onEdit: (index: number) => void; onDelete: (index: number) => void }) { return <><div className="settings-grid table-header option-grid"><span></span><span>Tên tùy chọn</span><span>Thứ tự <Icon name="arrow" size={14} /></span><span>Thao tác</span></div><div className="settings-rows">{options.map((option, index) => <div className="settings-grid settings-row option-grid" key={`${option}-${index}`}><span className="checkbox"></span><span>{option}</span><span className="order-input"><Icon name="grip" size={18} /><input value={index + 1} readOnly /></span><span className="row-actions"><button onClick={() => onEdit(index)}><Icon name="edit" size={17} /></button><button className="red-icon" onClick={() => onDelete(index)}><Icon name="trash" size={16} /></button></span></div>)}</div><div className="pagination"><span>Hiển thị <select><option>10 / trang</option></select></span><div><button>‹</button><button className="active-page">1</button><button>2</button><button>3</button><button>...</button><button>5</button><button>›</button></div></div></>; }

function FieldsTable({ fields, onEdit, onDelete }: { fields: FieldConfig[]; onEdit: (index: number) => void; onDelete: (index: number) => void }) { return <><div className="settings-grid table-header field-grid-settings"><span>Tên trường</span><span>Loại trường</span><span>Bắt buộc</span><span>Thứ tự <Icon name="arrow" size={14} /></span><span>Thao tác</span></div><div className="settings-rows">{fields.map((field, index) => <div className="settings-grid settings-row field-grid-settings" key={field.key}><span className="field-row-name"><Icon name="grip" size={18} />{field.label}</span><span>{field.type === "select" ? "Select" : "Text"}</span><span><span className={`required-pill ${index === 0 ? "yes" : ""}`}>{index === 0 ? "Có" : "Không"}</span></span><span><input className="order-number" value={index + 1} readOnly /></span><span className="row-actions"><button onClick={() => onEdit(index)}><Icon name="edit" size={17} /></button><button className="red-icon" onClick={() => onDelete(index)}><Icon name="trash" size={16} /></button></span></div>)}</div><div className="pagination"><span>Hiển thị <select><option>10 / trang</option></select></span><div><button>‹</button><button className="active-page">1</button><button>2</button><button>3</button><button>...</button><button>5</button><button>›</button></div></div></>; }

function JsonView({ form, onImport }: { form: Record<string, string>; onImport: (event: ChangeEvent<HTMLInputElement>) => void }) { const [raw, setRaw] = useState(JSON.stringify(makeJson(form), null, 2)); return <div className="json-view"><div className="panel json-editor"><div className="panel-heading heading-actions"><div><h2>XUẤT / NHẬP JSON</h2><p>Nhập JSON để cập nhật thông tin prompt hoặc xuất cấu trúc hiện tại.</p></div><div className="top-actions"><button className="outline-button" onClick={() => downloadJson(form)}><Icon name="upload" size={18} />Xuất JSON</button><button className="primary-button small-button" onClick={() => document.getElementById("json-screen-import")?.click()}><Icon name="download" size={18} />Nhập JSON</button><input id="json-screen-import" type="file" accept="application/json" hidden onChange={onImport} /></div></div><textarea value={raw} onChange={(event) => setRaw(event.target.value)} /><div className="json-editor-actions"><span className="valid-pill">✓ JSON hợp lệ</span><button className="primary-button" onClick={() => navigator.clipboard?.writeText(raw)}><Icon name="copy" size={17} />Copy JSON</button></div></div><div className="panel json-help"><h2>HƯỚNG DẪN</h2><p>1. Xuất JSON để dùng làm dữ liệu đầu vào cho AI Tool.</p><p>2. Dán JSON đã chỉnh sửa vào khung bên trái.</p><p>3. Nhập lại file JSON để cập nhật form.</p></div></div>; }

export default function Home() {
  const [screen, setScreen] = useState<Screen>("create");
  const [activeCategory, setActiveCategory] = useState<PromptCategory>("character");
  const [form, setForm] = useState<Record<string, string>>(defaultForm);
  const [prompts, setPrompts] = useState<PromptRecord[]>(initialPrompts);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecord>(initialPrompts[0]);
  const [editingPromptId, setEditingPromptId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("options");
  const [settingsCategory, setSettingsCategory] = useState<PromptCategory>("character");
  const [selectedGroup, setSelectedGroup] = useState("subject");
  const [options, setOptions] = useState(expandedOptionLists);
  const [fields, setFields] = useState<Record<string, FieldConfig[]>>(() => Object.fromEntries(groups.map((group) => [group.key, group.fields])));
  const [toast, setToast] = useState("");
  const [cloudConfig, setCloudConfig] = useState<CloudSyncConfig>(() => {
    if (typeof window === "undefined") return defaultCloudSyncConfig;
    try {
      return { ...defaultCloudSyncConfig, ...JSON.parse(window.localStorage.getItem("prompt-manager-cloud-sync") || "{}") };
    } catch {
      return defaultCloudSyncConfig;
    }
  });
  const [syncState, setSyncState] = useState<CloudSyncState>("idle");
  const cloudOperationRef = useRef<"save" | "load" | null>(null);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const updateForm = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const savePrompt = () => {
    const imageUrls = promptImagesFromForm(form);
    const existingPrompt = editingPromptId === null ? undefined : prompts.find((prompt) => prompt.id === editingPromptId);
    const savedPrompt: PromptRecord = {
      id: existingPrompt?.id || Date.now(),
      title: `${form.name || "Prompt mới"} - ${form.time || "Bản nháp"}`,
      subject: form.name || "Chưa đặt tên",
      topic: "Nhân vật",
      style: form.style?.split(" /")[0] || "Realistic",
      ratio: form.aspect_ratio || "16:9",
      created: existingPrompt?.created || new Date().toLocaleString("vi-VN"),
      description: makePrompt(form),
      imageUrl: imageUrls.character || imageUrls.scenery || imageUrls.action,
      imageUrls,
      data: { ...form, image_url_character: imageUrls.character, image_url_scenery: imageUrls.scenery, image_url_action: imageUrls.action },
    };
    setPrompts((current) => existingPrompt ? current.map((prompt) => prompt.id === existingPrompt.id ? savedPrompt : prompt) : [savedPrompt, ...current]);
    setSelectedPrompt(savedPrompt);
    setEditingPromptId(savedPrompt.id);
    showToast(existingPrompt ? "Đã ghi đè prompt trong thư viện" : "Đã lưu prompt vào thư viện");
  };
  const clearAll = () => { setForm(defaultForm); setEditingPromptId(null); showToast("Đã đặt lại thông tin prompt"); };
  const importJson = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)); const next = { ...form, ...parsed.subject, ...parsed.character_details, hair_style: parsed.character_details?.hair_style ?? form.hair_style, hair_color: parsed.character_details?.hair_color ?? form.hair_color, eye_color: parsed.character_details?.eye_color ?? form.eye_color, ...parsed.character_mood, character_pose: parsed.character_mood?.pose ?? form.character_pose, character_mood: parsed.character_mood?.mood ?? form.character_mood, ...parsed.environment, location: parsed.environment?.location ?? form.location, scene_type: parsed.environment?.type ?? form.scene_type, scene: parsed.environment?.description ?? form.scene, ...parsed.scenery_weather, environment_light: parsed.scenery_weather?.light ?? form.environment_light, ...parsed.terrain, terrain: parsed.terrain?.main ?? form.terrain, vegetation: parsed.terrain?.vegetation ?? form.vegetation, water: parsed.terrain?.water ?? form.water, landmark: parsed.terrain?.highlights ?? form.landmark, ...parsed.scenery_style, scenery_style: parsed.scenery_style?.style ?? form.scenery_style, scenery_composition: parsed.scenery_style?.composition ?? form.scenery_composition, scenery_ratio: parsed.scenery_style?.aspect_ratio ?? form.scenery_ratio, scenery_palette: parsed.scenery_style?.palette ?? form.scenery_palette, scenery_detail: parsed.scenery_style?.detail ?? form.scenery_detail, ...parsed.scenery_other, ...parsed.camera, ...parsed.lighting, ...parsed.style, clothing_material: parsed.clothing?.material ?? form.clothing_material, clothing_condition: parsed.clothing?.condition ?? form.clothing_condition, ...parsed.clothing, weapon_material: parsed.weapon_prop?.material ?? form.weapon_material, weapon_condition: parsed.weapon_prop?.condition ?? form.weapon_condition, ...parsed.weapon_prop, ...parsed.quality, negative: parsed.quality?.negative_prompt || form.negative, action_type: parsed.action?.type ?? form.action_type, action_intensity: parsed.action?.intensity ?? form.action_intensity, main_action: parsed.action?.main_action ?? form.main_action, action_details: parsed.action?.details ?? form.action_details, action_result: parsed.action?.result ?? form.action_result, character_pose: parsed.poses?.character_pose ?? form.character_pose, character_expression: parsed.poses?.character_expression ?? form.character_expression, target_pose: parsed.poses?.target_pose ?? form.target_pose, target_expression: parsed.poses?.target_expression ?? form.target_expression, character_direction: parsed.movement_direction?.character ?? form.character_direction, target_direction: parsed.movement_direction?.target ?? form.target_direction, action_camera: parsed.movement_direction?.camera_follow ?? form.action_camera, action_start: parsed.timing?.start ?? form.action_start, action_peak: parsed.timing?.climax ?? form.action_peak, action_end: parsed.timing?.end ?? form.action_end, action_prop: parsed.action_prop?.item ?? form.action_prop, prop_hand: parsed.action_prop?.hand ?? form.prop_hand, prop_description: parsed.action_prop?.description ?? form.prop_description, motion_effect: parsed.action_effects?.motion ?? form.motion_effect, impact_effect: parsed.action_effects?.impact ?? form.impact_effect, sound_effect: parsed.action_effects?.sound ?? form.sound_effect, action_lighting: parsed.action_other?.lighting ?? form.action_lighting, action_note: parsed.action_other?.note ?? form.action_note }; setForm(next); showToast("Đã nhập JSON thành công"); } catch { showToast("File JSON không hợp lệ"); } }; reader.readAsText(file); };
  const filteredSelected = useMemo(() => prompts.find((prompt) => prompt.id === selectedPrompt.id) || prompts[0] || initialPrompts[0], [prompts, selectedPrompt.id]);
  const configuredGroups = groups.map((group) => ({ ...group, fields: fields[group.key] || group.fields }));
  const saveToCloud = async () => {
    if (cloudOperationRef.current) return;
    const config = { apiUrl: cloudConfig.apiUrl.trim() };
    if (!config.apiUrl) { showToast("Vui lòng cấu hình URL Google Sheet"); setSyncState("error"); return; }
    cloudOperationRef.current = "save";
    setCloudConfig(config);
    window.localStorage.setItem("prompt-manager-cloud-sync", JSON.stringify(config));
    setSyncState("saving");
    try {
      await syncCloudData(config, prompts, options, fields);
      setSyncState("success");
      showToast(`Đã lưu ${prompts.length} prompt lên Google Sheet`);
    } catch (error) {
      setSyncState("error");
      showToast(error instanceof Error ? error.message : "Lưu lên Google Sheet thất bại");
    } finally {
      cloudOperationRef.current = null;
    }
  };
  const loadFromCloud = async () => {
    if (cloudOperationRef.current) return;
    const config = { apiUrl: cloudConfig.apiUrl.trim() };
    if (!config.apiUrl) { showToast("Vui lòng cấu hình URL Google Sheet"); setSyncState("error"); return; }
    cloudOperationRef.current = "load";
    setCloudConfig(config);
    window.localStorage.setItem("prompt-manager-cloud-sync", JSON.stringify(config));
    setSyncState("loading");
    try {
      const remote = await loadCloudData(config);
      const nextPrompts = (remote.prompts || []).map(normalizePromptRecord);
      setPrompts(nextPrompts);
      setSelectedPrompt(nextPrompts[0] || initialPrompts[0]);
      setEditingPromptId(null);
      if (remote.options) setOptions(remote.options);
      if (remote.fields) setFields(remote.fields);
      setSyncState("success");
      showToast(`Đã tải ${nextPrompts.length} prompt từ Google Sheet`);
    } catch (error) {
      setSyncState("error");
      showToast(error instanceof Error ? error.message : "Tải dữ liệu từ Google Sheet thất bại");
    } finally {
      cloudOperationRef.current = null;
    }
  };
  const openPromptForEditing = (prompt: PromptRecord) => { setSelectedPrompt(prompt); setForm(formWithPromptImages(prompt)); setEditingPromptId(prompt.id); setScreen("create"); };
  const openNewPrompt = (nextScreen: Screen) => { if (nextScreen === "create" && screen !== "create") { setForm(defaultForm); setEditingPromptId(null); } setScreen(nextScreen); };
  const content = screen === "create" ? <CreateView form={form} onUpdate={updateForm} prompts={prompts} onNavigate={openNewPrompt} configuredGroups={configuredGroups} settingsOptions={options} onSelectPrompt={openPromptForEditing} activeCategory={activeCategory} /> : screen === "library" ? <LibraryView prompts={prompts} search={search} setSearch={setSearch} selected={filteredSelected} onSelect={setSelectedPrompt} onDelete={(id) => { setPrompts((current) => current.filter((prompt) => prompt.id !== id)); if (editingPromptId === id) { setEditingPromptId(null); setForm(defaultForm); } showToast("Đã xóa prompt"); }} onEdit={openPromptForEditing} onCopy={(prompt) => { setPrompts((current) => [{ ...prompt, id: Date.now(), title: `${prompt.title} (bản sao)` }, ...current]); showToast("Đã sao chép prompt"); }} /> : screen === "settings" ? <SettingsView tab={settingsTab} setTab={setSettingsTab} category={settingsCategory} setCategory={setSettingsCategory} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} options={options} setOptions={setOptions} fields={fields} setFields={setFields} /> : <JsonView form={form} onImport={importJson} />;
  return <div className="app-shell"><Sidebar screen={screen} onNavigate={openNewPrompt} activeCategory={activeCategory} onCategoryChange={setActiveCategory} /><main className="main-area"><Toolbar onImport={importJson} onSave={savePrompt} onSaveToCloud={saveToCloud} onClear={clearAll} onSync={loadFromCloud} syncState={syncState} /><div className="content-area">{content}</div><footer className="app-footer">Prompt Manager · Quản lý & tái sử dụng prompt</footer></main>{toast && <div className="toast">{toast}</div>}</div>;
}
