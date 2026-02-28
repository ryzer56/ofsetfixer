"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Upload,
  Grid3X3,
  RotateCcw,
  Copy,
  Check,
  Minus,
  Plus,
  Trash2,
  PlusCircle,
  Layers,
  Move,
  Settings2,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GuiConfig {
  id: string
  pngName: string
  xOffset: number
  yOffset: number
  width: number
  height: number
  preset: PresetKey
}

const presets = {
  row6: {
    name: "6 Rows",
    image: "/images/generic-54.png",
    displayName: "generic_54.png",
  },
  row5: {
    name: "5 Rows",
    image: "/images/row5.png",
    displayName: "row5.png",
  },
  row4: {
    name: "4 Rows",
    image: "/images/row4.png",
    displayName: "row4.png",
  },
  row3: {
    name: "3 Rows",
    image: "/images/row3.png",
    displayName: "row3.png",
  },
  row2: {
    name: "2 Rows",
    image: "/images/row2.png",
    displayName: "row2.png",
  },
  row1: {
    name: "1 Row",
    image: "/images/row1.png",
    displayName: "row1.png",
  },
}

type PresetKey = keyof typeof presets

export default function ChestGUIChecker() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null)
  const [gridImage, setGridImage] = useState<HTMLImageElement | null>(null)
  const [xOffset, setXOffset] = useState(0)
  const [yOffset, setYOffset] = useState(0)
  const [gridOpacity, setGridOpacity] = useState(0.35)
  const [activePreset, setActivePreset] = useState<PresetKey>("row6")
  const [showGrid, setShowGrid] = useState(true)
  const [pngName, setPngName] = useState("chest")
  const [copied, setCopied] = useState(false)
  const [guiWidth, setGuiWidth] = useState(176)
  const [guiHeight, setGuiHeight] = useState(166)
  const [savedConfigs, setSavedConfigs] = useState<GuiConfig[]>([])

  const currentPreset = presets[activePreset]

  useEffect(() => {
    const img = document.createElement("img") as HTMLImageElement
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setGridImage(img)
    }
    img.src = currentPreset.image
  }, [currentPreset.image])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    if (uploadedImage) {
      const drawX = centerX - guiWidth / 2 + xOffset
      const drawY = centerY - guiHeight / 2 + yOffset
      ctx.drawImage(uploadedImage, drawX, drawY, guiWidth, guiHeight)
    }

    if (showGrid && gridImage) {
      ctx.globalAlpha = gridOpacity
      const gridDrawX = centerX - gridImage.naturalWidth / 2
      const gridDrawY = centerY - gridImage.naturalHeight / 2
      ctx.drawImage(gridImage, gridDrawX, gridDrawY, gridImage.naturalWidth, gridImage.naturalHeight)
      ctx.globalAlpha = 1
    }
  }, [uploadedImage, gridImage, xOffset, yOffset, guiWidth, guiHeight, showGrid, gridOpacity])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    draw()
  }, [draw])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    draw()
  }, [draw])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = file.name.replace(/\.png$/i, "")
    setPngName(fileName)

    const reader = new FileReader()
    reader.onload = () => {
      const img = document.createElement("img") as HTMLImageElement
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setUploadedImage(img)
        setGuiWidth(img.naturalWidth)
        setGuiHeight(img.naturalHeight)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const applyPreset = (preset: PresetKey) => {
    setActivePreset(preset)
  }

  const resetAll = () => {
    setXOffset(0)
    setYOffset(0)
    setGridOpacity(0.35)
    setActivePreset("row6")
    if (uploadedImage) {
      setGuiWidth(uploadedImage.naturalWidth)
      setGuiHeight(uploadedImage.naturalHeight)
    } else {
      setGuiWidth(176)
      setGuiHeight(166)
    }
  }

  const addConfig = () => {
    const newConfig: GuiConfig = {
      id: Date.now().toString(),
      pngName,
      xOffset,
      yOffset,
      width: guiWidth,
      height: guiHeight,
      preset: activePreset,
    }
    setSavedConfigs((prev) => [...prev, newConfig])
    setPngName("chest")
    setXOffset(0)
    setYOffset(0)
    setGuiWidth(176)
    setGuiHeight(166)
  }

  const removeConfig = (id: string) => {
    setSavedConfigs((prev) => prev.filter((c) => c.id !== id))
  }

  const getGuiType = (preset: PresetKey) => {
    if (preset === "row1" || preset === "row2" || preset === "row3") {
      return "chest.gui_image_small"
    }
    return "chest.gui_image_large"
  }

  const generateSingleConfig = (config: GuiConfig) => {
    const guiType = getGuiType(config.preset)
    return `"${config.pngName}@${guiType}": {
  "texture": "textures/guis/${config.pngName}",
  "$unicode": "$unicode_${config.pngName.replace(/-/g, "_")}",
  "size": [${config.width}, ${config.height}],
  "offset": [${config.xOffset}, ${config.yOffset}]
}`
  }

  const generateAllConfigs = () => {
    const currentConfig: GuiConfig = {
      id: "current",
      pngName,
      xOffset,
      yOffset,
      width: guiWidth,
      height: guiHeight,
      preset: activePreset,
    }
    const allConfigs = [...savedConfigs, currentConfig]
    return allConfigs.map(generateSingleConfig).join(",\n\n")
  }

  const generateGuiEntryForChest = (config: GuiConfig, isSmall: boolean) => {
    const offset = isSmall ? [-45, -44] : [0, -44]
    const sanitizedName = config.pngName.replace(/-/g, "_")
    return `    {
      "${config.pngName}@chest.gui_image_large": {
        "texture": "textures/guis/${config.pngName}",
        "$unicode": "$unicode_${sanitizedName}",
        "$ctitle": "$ctitle_with_symbol",
        "size": [${config.width}, ${config.height}],
        "offset": [${config.xOffset}, ${config.yOffset}]
      }
    }`
  }

  const generateFullChestJson = () => {
    const currentConfig: GuiConfig = {
      id: "current",
      pngName,
      xOffset,
      yOffset,
      width: guiWidth,
      height: guiHeight,
      preset: activePreset,
    }
    const allConfigs = [...savedConfigs, currentConfig]
    
    const smallChestControls = allConfigs.map((config) => generateGuiEntryForChest(config, true)).join(",\n")
    const largeChestControls = allConfigs.map((config) => generateGuiEntryForChest(config, false)).join(",\n")

    const fullStructure = `{
   "namespace": "chest",
   "custom_dialog_background@common.dialog_background_common": {
      "texture": "textures/dialog_background"
   },
   "gui_image_small": {
      "type": "image",
      "size": [256, 256],
      "offset": [0, "-4px-19px"],
      "anchor_from": "bottom_left",
      "anchor_to": "top_left",
      "alpha": 2,
      "layer": 5,
      "visible": "($ctitle / $unicode)"
   },
   "gui_image_large@gui_image_small": {
      "offset": [0, "-3px-19px"]
   },
   "small_chest_grid": {
      "$size": [162, 54],
      "$grid_dimensions": [9, 3],
      "variables": [
         {"requires": "$2row_chest_guis", "$grid_dimensions": [9, 2], "$size": [162, 36]},
         {"requires": "$1row_chest_guis", "$grid_dimensions": [9, 1], "$size": [162, 18]}
      ],
      "size": "$size",
      "grid_dimensions": "$grid_dimensions"
   },
   "large_chest_grid": {
      "$size": [162, 108],
      "$grid_dimensions": [9, 6],
      "variables": [
         {"requires": "$5row_chest_guis", "$grid_dimensions": [9, 5], "$size": [162, 90]},
         {"requires": "$4row_chest_guis", "$grid_dimensions": [9, 4], "$size": [162, 72]}
      ],
      "size": "$size",
      "grid_dimensions": "$grid_dimensions"
   },
   "small_chest_panel": {
      "$ctitle": "$container_title",
      "$ctitle_with_symbol": "('§' + $ctitle)"
   },
   "small_chest_panel/root_panel": {
      "size": "$size",
      "$size": [176, 166],
      "$custom_guis|default": false,
      "modifications": [
         {
            "array_name": "variables",
            "operation": "insert_front",
            "value": [
               {"requires": "$3row_chest_guis", "$size": [176, 169], "$custom_guis": true},
               {"requires": "$2row_chest_guis", "$size": [176, 151], "$custom_guis": true},
               {"requires": "$1row_chest_guis", "$size": [176, 133], "$custom_guis": true}
            ]
         }
      ]
   },
   "small_chest_panel/root_panel/chest_panel/inventory_panel_bottom_half_with_label": {
      "offset": "$offset",
      "$offset": [0, 0],
      "modifications": [
         {
            "array_name": "variables",
            "operation": "insert_front",
            "value": [{"requires": "$custom_guis", "$offset": [0, -1]}]
         }
      ]
   },
   "small_chest_panel_top_half": {
      "modifications": [
         {
            "array_name": "controls",
            "operation": "insert_front",
            "value": [{"small_chest_guis@chest.small_chest_guis": {}}]
         }
      ]
   },
   "small_chest_guis": {
      "type": "panel",
      "anchor_from": "top_left",
      "anchor_to": "top_left",
      "size": ["100%", 9],
      "layer": 2,
      "controls": [
${smallChestControls}
      ]
   },
   "small_chest_panel/root_panel/common_panel": {
      "offset": "$offset",
      "$offset": [0, 0],
      "modifications": [
         {
            "array_name": "variables",
            "operation": "insert_front",
            "value": [
               {"requires": "$custom_guis", "$dialog_background": "chest.custom_dialog_background", "$close_button_layer": 15, "$close_button_offset": [-2, 5]},
               {"requires": "$compact_close_guis", "$use_compact_close_button": true, "$close_button_offset": "$compact_close_guis_size"},
               {"requires": "$close_size2_guis", "$close_button_size": [21, 17], "$close_button_panel_size": [15, 11], "$close_button_offset": [0, 0]}
            ]
         }
      ]
   },
   "large_chest_panel": {
      "$ctitle": "$container_title",
      "$ctitle_with_symbol": "('§' + $ctitle)"
   },
   "large_chest_panel/root_panel": {
      "size": "$size",
      "$size": [176, 220],
      "$custom_guis|default": false,
      "modifications": [
         {
            "array_name": "variables",
            "operation": "insert_front",
            "value": [
               {"requires": "$6row_chest_guis", "$size": [176, 223], "$custom_guis": true},
               {"requires": "$5row_chest_guis", "$size": [176, 205], "$custom_guis": true},
               {"requires": "$4row_chest_guis", "$size": [176, 187], "$custom_guis": true}
            ]
         }
      ]
   },
   "large_chest_panel/root_panel/chest_panel/inventory_panel_bottom_half_with_label": {
      "offset": "$offset",
      "$offset": [0, 0],
      "modifications": [
         {
            "array_name": "variables",
            "operation": "insert_front",
            "value": [{"requires": "$custom_guis", "$offset": [0, -1]}]
         }
      ]
   },
   "large_chest_panel_top_half": {
      "modifications": [
         {
            "array_name": "controls",
            "operation": "insert_front",
            "value": [{"large_chest_guis@chest.large_chest_guis": {}}]
         }
      ]
   },
   "large_chest_guis@small_chest_guis": {
      "controls": [
${largeChestControls}
      ]
   },
   "large_chest_panel/root_panel/common_panel": {
      "offset": "$offset",
      "$offset": [0, 0],
      "modifications": [
         {
            "array_name": "variables",
            "operation": "insert_front",
            "value": [
               {"requires": "$custom_guis", "$dialog_background": "chest.custom_dialog_background", "$close_button_layer": 15, "$close_button_offset": [0, -4]},
               {"requires": "$compact_close_guis", "$use_compact_close_button": true, "$close_button_offset": "$compact_close_guis_size"},
               {"requires": "$close_size2_guis", "$close_button_size": [21, 17], "$close_button_panel_size": [15, 11], "$close_button_offset": [0, 5]}
            ]
         }
      ]
   },
   "small_chest_screen@common.inventory_screen_common": {
      "$atitle": "$container_title",
      "$ctitle_with_symbol": "('§' + $atitle)",
      "$custom_chest_guis": "$pocket_gui",
      "$force_render_below|default": false,
      "force_render_below": "$force_render_below",
      "variables": [
         {"requires": "($desktop_screen or $custom_chest_guis)", "$screen_content": "chest.small_chest_panel", "$screen_bg_content": "common.screen_background"},
         {"requires": "$custom_chest_guis", "$screen_animations": [], "$background_animations": [], "$force_render_below": true},
         {"requires": "($pocket_screen and not $custom_chest_guis)", "$use_custom_pocket_toast": true, "$screen_content": "pocket_containers.small_chest_panel"}
      ]
   },
   "large_chest_screen@common.inventory_screen_common": {
      "$atitle": "$container_title",
      "$ctitle_with_symbol": "('§' + $atitle)",
      "$custom_chest_guis": "$pocket_gui",
      "$force_render_below|default": false,
      "force_render_below": "$force_render_below",
      "variables": [
         {"requires": "($desktop_screen or $custom_chest_guis)", "$screen_content": "chest.large_chest_panel", "$screen_bg_content": "common.screen_background"},
         {"requires": "$custom_chest_guis", "$screen_animations": [], "$background_animations": [], "$force_render_below": true},
         {"requires": "($pocket_screen and not $custom_chest_guis)", "$use_custom_pocket_toast": true, "$screen_content": "pocket_containers.large_chest_panel"}
      ]
   }
}`
    return fullStructure
  }

  const downloadChestJson = () => {
    const content = generateFullChestJson()
    const element = document.createElement("a")
    const file = new Blob([content], { type: "application/json" })
    element.href = URL.createObjectURL(file)
    element.download = "chest.json"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(generateAllConfigs())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-orange-500 to-orange-600 shadow-sm">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">GUI Offset Editor</h1>
              <p className="text-xs text-zinc-500">Minecraft Bedrock</p>
            </div>
          </div>
          <a href="https://discord.gg/wKpVdt8R5R" target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-lg border-zinc-200 text-zinc-600 hover:border-[#5865F2] hover:bg-[#5865F2]/10 hover:text-[#5865F2] transition-all bg-transparent"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Discord
            </Button>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Editor Canvas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-zinc-700">Editor Canvas</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 gap-1.5 text-xs ${showGrid ? "bg-orange-50 text-orange-600" : "text-zinc-600"}`}
                  onClick={() => setShowGrid((s) => !s)}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                  Grid
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-zinc-600" onClick={resetAll}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
            </div>

            <div
              ref={containerRef}
              className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-lg"
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
              {!uploadedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="rounded-full bg-zinc-800 p-4">
                    <Upload className="h-6 w-6 text-zinc-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-400">No image uploaded</p>
                    <p className="text-xs text-zinc-600">Upload a PNG to get started</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <input ref={fileInputRef} type="file" accept="image/png" onChange={handleFileUpload} className="hidden" />
              <Button
                variant="outline"
                className="w-full h-12 gap-2 rounded-xl border-dashed border-2 border-zinc-300 bg-white text-zinc-600 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {uploadedImage ? "Change GUI Image" : "Upload GUI PNG"}
              </Button>
            </div>

            {/* Generated Config */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-zinc-700">Generated Config</span>
                </div>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                  {savedConfigs.length + 1} item{savedConfigs.length > 0 ? "s" : ""}
                </span>
              </div>

              <pre className="mb-3 max-h-48 overflow-auto rounded-xl bg-zinc-900 p-4 text-xs">
                <code className="text-zinc-300">{generateAllConfigs()}</code>
              </pre>

              <div className="flex gap-2">
                <Button
                  className="flex-1 h-10 gap-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
                  onClick={copyCode}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  className="flex-1 h-10 gap-2 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  onClick={downloadChestJson}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            {/* Config Builder */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-zinc-700">Config Builder</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500">Filename</Label>
                  <Input
                    value={pngName}
                    onChange={(e) => setPngName(e.target.value)}
                    placeholder="chest"
                    className="h-9 rounded-lg border-zinc-200 bg-zinc-50 font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500">Width</Label>
                    <Input
                      type="number"
                      value={guiWidth}
                      onChange={(e) => setGuiWidth(Number(e.target.value))}
                      className="h-9 rounded-lg border-zinc-200 bg-zinc-50 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500">Height</Label>
                    <Input
                      type="number"
                      value={guiHeight}
                      onChange={(e) => setGuiHeight(Number(e.target.value))}
                      className="h-9 rounded-lg border-zinc-200 bg-zinc-50 font-mono text-sm"
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-10 gap-2 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  onClick={addConfig}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Config
                </Button>
              </div>
            </div>

            {/* Offset Controls */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Move className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-zinc-700">Position</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-500">X Offset</Label>
                    <span className="font-mono text-xs font-medium text-orange-600">{xOffset}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-lg border-zinc-200 bg-transparent"
                      onClick={() => setXOffset((x) => x - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Slider
                      value={[xOffset]}
                      onValueChange={(value) => value?.[0] !== undefined && setXOffset(value[0])}
                      min={-100}
                      max={100}
                      step={1}
                      className="flex-1 **:[[role=slider]]:h-4 **:[[role=slider]]:w-4 **:[[role=slider]]:bg-orange-500 **:[[role=slider]]:border-0"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-lg border-zinc-200 bg-transparent"
                      onClick={() => setXOffset((x) => x + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-500">Y Offset</Label>
                    <span className="font-mono text-xs font-medium text-orange-600">{yOffset}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-lg border-zinc-200 bg-transparent"
                      onClick={() => setYOffset((y) => y - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Slider
                      value={[yOffset]}
                      onValueChange={(value) => value?.[0] !== undefined && setYOffset(value[0])}
                      min={-100}
                      max={100}
                      step={1}
                      className="flex-1 **:[[role=slider]]:h-4 **:[[role=slider]]:w-4 **:[[role=slider]]:bg-orange-500 **:[[role=slider]]:border-0"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-lg border-zinc-200 bg-transparent"
                      onClick={() => setYOffset((y) => y + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-500">Grid Opacity</Label>
                    <span className="font-mono text-xs font-medium text-zinc-600">
                      {Math.round(gridOpacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[gridOpacity]}
                    onValueChange={(value) => value?.[0] !== undefined && setGridOpacity(value[0])}
                    min={0}
                    max={1}
                    step={0.05}
                    className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4 **:[[role=slider]]:bg-zinc-700 **:[[role=slider]]:border-0"
                  />
                </div>
              </div>
            </div>

            {/* Row Presets */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-zinc-700">Grid Preset</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(presets) as PresetKey[]).map((key) => (
                  <button
                    key={key}
                    className={`rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                      activePreset === key
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                    onClick={() => applyPreset(key)}
                  >
                    {presets[key].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Configs */}
            {savedConfigs.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-zinc-700">Saved</span>
                  </div>
                  <span className="text-xs text-zinc-500">{savedConfigs.length} configs</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedConfigs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                      <div className="flex-1 truncate">
                        <span className="font-mono text-xs font-medium text-zinc-700">{config.pngName}</span>
                        <span className="ml-2 text-xs text-zinc-400">
                          [{config.xOffset}, {config.yOffset}]
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                        onClick={() => removeConfig(config.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <p className="text-center text-xs text-zinc-500">All rights reserved by Pack Crafters 2026</p>
        </div>
      </footer>
    </div>
  )
}
