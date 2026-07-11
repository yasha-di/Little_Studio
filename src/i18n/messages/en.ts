/**
 * English — the reference dictionary. Every user-facing string in the app
 * lives here (and in each translation) under a stable key; components never
 * contain literal copy. `MessageKey` is derived from this object, so a
 * translation missing a key is a compile error, not a runtime surprise.
 *
 * Interpolation: `{name}` placeholders, filled by `t(key, params)`.
 * Plurals: sibling keys `.one` / `.few` / `.many` / `.other` selected via
 * `Intl.PluralRules` (see `tCount`).
 */
export const en = {
  // Application identity
  "app.tagline": "Creative AI Video Workspace",

  // Common
  "common.soon": "Soon",
  "common.on": "On",
  "common.off": "Off",
  "common.close": "Close",
  "common.loading": "Loading",
  "nav.primaryAria": "Primary",
  "composer.composerAria": "Prompt composer",

  // Sidebar navigation
  "nav.studio": "Studio",
  "nav.projects": "Projects",
  "nav.library": "Library",
  "nav.preferences": "Preferences",
  "nav.recent": "Recent",
  "nav.expandSidebar": "Expand sidebar",
  "nav.collapseSidebar": "Collapse sidebar",
  "nav.aboutTooltip": "About {name}",

  // Top bar
  "topbar.connect": "Connect OpenRouter",
  "topbar.provider": "OpenRouter",
  "topbar.creditsAria": "Provider credits",
  "topbar.creditsEmpty": "Balance appears after connecting a provider",
  "topbar.creditsTooltip": "Remaining OpenRouter credits",
  "topbar.openPreferences": "Open preferences",
  "topbar.preferences": "Preferences",

  // Status bar
  "statusbar.estNone": "Est. —",
  "statusbar.estUnknown": "Est. unknown",
  "statusbar.estValue": "Est. ${amount}",
  "statusbar.estSelectModel": "Select a model to estimate cost",
  "statusbar.estPublished": "Estimated from the provider's published pricing",
  "statusbar.estBreakdown": "{rate} × {seconds}s — the provider's published price",
  "statusbar.lastTake": "Last take ${amount}",
  "statusbar.lastTakeTitle": "Actual cost of the latest completed take",
  "statusbar.credits": "Credits {amount}",
  "statusbar.creditsConnect": "Credits appear after connecting a provider",
  "statusbar.creditsRemaining": "Remaining provider credits",
  "statusbar.liveTitle": "Live generation status",
  "statusbar.plannedDuration": "Planned duration",
  "statusbar.resolution": "Resolution",
  "statusbar.aspectRatio": "Aspect ratio",
  "statusbar.provider": "Provider",

  // Projects home
  "projects.greeting.late": "Working late",
  "projects.greeting.morning": "Good morning",
  "projects.greeting.afternoon": "Good afternoon",
  "projects.greeting.evening": "Good evening",
  "projects.subtitle": "Every film lives in a project — scene by scene, take by take.",
  "projects.new": "New project",
  "projects.loadError": "Could not load projects. {message}",
  "projects.actionsFor": "Project actions for {name}",
  "projects.deleteTitle": 'Delete "{name}"?',
  "projects.deleteDescription":
    "The project and all of its scenes will be removed. This cannot be undone.",
  "projects.deleteConfirm": "Delete project",
  "projectCard.noDescription": "No description",
  "projectCard.updated": "Updated {date}",
  "projectCard.scenes.one": "{count} scene",
  "projectCard.scenes.other": "{count} scenes",

  // Welcome (first launch)
  "welcome.title": "Welcome to",
  "welcome.subtitle":
    "Your studio for AI video — write a scene, generate takes, keep every version.",
  "welcome.stepWrite": "Write the shot",
  "welcome.stepModel": "Pick a model",
  "welcome.stepGenerate": "Generate takes",
  "welcome.howItWorks": "How it works",
  "welcome.cta": "Create your first project",
  "welcome.hint": "works from anywhere",

  // Workspace
  "workspace.projectName": "Project name",
  "workspace.notFound": "Project not found",
  "workspace.notFoundDescription": "It may have been deleted.",
  "workspace.backToProjects": "Back to projects",
  "workspace.noScenes": "No scenes yet",
  "workspace.noScenesDescription":
    "A scene is one shot of your film — its prompt, references and settings live together.",
  "workspace.createsScene": "creates a scene",

  // Scene rail
  "scenes.title": "Scenes",
  "scenes.new": "New scene",
  "scenes.empty": "No scenes yet. Press {shortcut} or the + button to add the first one.",
  "scenes.actionsFor": "Scene actions for {name}",
  "scenes.duplicate": "Duplicate",
  "scenes.moveUp": "Move up",
  "scenes.moveDown": "Move down",
  "scenes.deleteTitle": 'Delete "{name}"?',
  "scenes.deleteDescription":
    "The scene, its prompt and its settings will be removed. This cannot be undone.",
  "scenes.deleteConfirm": "Delete scene",

  // Scene editor
  "editor.sceneName": "Scene name",
  "editor.notes": "Notes",
  "editor.notesPlaceholder": "Director's notes — intent, feedback, todo…",
  "tags.add": "Add tag…",
  "tags.remove": "Remove tag {tag}",

  // Prompt composer
  "composer.prompt": "Prompt",
  "composer.promptPlaceholder": "Describe the shot — subject, motion, camera, light, mood…",
  "composer.negative": "Negative prompt",
  "composer.negativePlaceholder": "What to avoid — artifacts, styles, objects…",
  "composer.toWrite": "to write",
  "composer.words.one": "{count} word",
  "composer.words.other": "{count} words",
  "composer.generate": "Generate",
  "composer.tryAgain": "Try again",
  "composer.cancel": "Cancel",
  "composer.generateTooltip": "Generate a new take of this scene ({shortcut})",
  "composer.canceled": "Generation canceled — your scene is unchanged.",
  "composer.openPreferences": "Open Preferences",
  "composer.hintConnect": "Connect OpenRouter to start generating",
  "composer.hintLoadingModels": "Loading models…",
  "composer.hintChooseModel": "Next · pick a model in the Inspector on the right",
  "composer.hintChooseExtendSource": "Next · choose which take to continue, below the prompt",
  "composer.hintAddStartImage": "Next · add a start image below the prompt",
  "composer.hintAddEndImage": "Next · add an end image below the prompt",
  "composer.hintWritePrompt": "Next · describe your shot above",
  "composer.hintReady": "Ready to generate",
  "composer.negativeNotSent": "This text stays with the scene but won't be sent.",

  // Generate blockers (tooltips on the disabled Generate button)
  "blocker.connect": "Connect OpenRouter in Preferences to generate.",
  "blocker.loadingModels": "Loading the model catalog…",
  "blocker.chooseModel": "Choose a model first.",
  "blocker.modeUnavailable": "This mode isn't available yet.",
  "blocker.noExtendSource": "No previous take available to extend.",
  "blocker.chooseExtendSource": "Choose which take to continue.",
  "blocker.addStartImage": "Add a start image first.",
  "blocker.addEndImage": "Add an end image first.",
  "blocker.writePrompt": "Write a prompt first.",
  "blocker.busy": "This scene is already generating.",

  // Generation success
  "success.isReady": "is ready",
  "success.showInLibrary": "Show in Library",
  "success.openFolder": "Open folder",
  "success.openFolderError": "Couldn't open the folder — try again",
  "success.generateAgain": "Generate again",

  // Generation modes
  "mode.title": "Mode",
  "mode.textToVideo.label": "Text to Video",
  "mode.textToVideo.description": "Generate the shot from your prompt alone",
  "mode.imageToVideo.label": "Image to Video",
  "mode.imageToVideo.description": "Animate a start image with your prompt",
  "mode.startEnd.label": "Start → End",
  "mode.startEnd.description": "Guide both the first and the last frame",
  "mode.extend.label": "Extend",
  "mode.extend.description": "Continue one of this scene's takes",
  "mode.loop.label": "Loop",
  "mode.loop.description": "Generate a seamlessly looping clip",
  "mode.selectorAria": "Generation mode",

  // Capabilities (labels + locked-feature descriptions)
  "capability.text-to-video.label": "Text to Video",
  "capability.text-to-video.description": "Generate a shot from the prompt alone",
  "capability.image-to-video.label": "Image to Video",
  "capability.image-to-video.description": "Animate from a start image",
  "capability.start-image.label": "Start image",
  "capability.start-image.description": "The first frame the video grows from",
  "capability.end-image.label": "End image",
  "capability.end-image.description": "Guide the final frame of the shot",
  "capability.extend.label": "Extend",
  "capability.extend.description": "Continue an existing take",
  "capability.loop.label": "Loop",
  "capability.loop.description": "Generate a seamlessly looping clip",
  "capability.negative-prompt.label": "Negative prompt",
  "capability.negative-prompt.description": "Describe what to avoid",
  "capability.camera-controls.label": "Camera Motion",
  "capability.camera-controls.description": "Direct pans, zooms and orbits",
  "capability.motion-brush.label": "Motion Brush",
  "capability.motion-brush.description": "Paint motion onto regions of the frame",
  "capability.character-reference.label": "Character Reference",
  "capability.character-reference.description": "Keep the same character across scenes",
  "capability.style-reference.label": "Style Reference",
  "capability.style-reference.description": "Match the look of a reference image",
  "capability.seed.label": "Seed",
  "capability.seed.description": "Pin randomness for repeatable takes",
  "capability.duration.label": "Duration",
  "capability.duration.description": "How long the clip runs",
  "capability.aspect-ratio.label": "Aspect ratio",
  "capability.aspect-ratio.description": "The frame's proportions",
  "capability.resolution.label": "Resolution",
  "capability.resolution.description": "Output pixel size",
  "capability.audio.label": "Audio",
  "capability.audio.description": "Generate sound along with the video",
  "capabilityReason.chooseModel": "Choose a model first.",
  "capabilityReason.notSupported": "{model} doesn't support {feature}.",
  "capabilityReason.notReported": "{model} doesn't report {feature} support.",
  "capabilityReason.comingSoon": "Coming to Little Studio in a future update.",

  // Extend mode
  "extend.continueFrom": "Continue from",
  "extend.sourceAria": "Take to continue",
  "extend.empty":
    "No previous take available to extend. Generate a first take of this scene, then continue it from here.",
  "extend.helper": "The new take will pick up where the selected take ends.",

  // Frames
  "frames.startFrame": "Start frame",
  "frames.frames": "Frames",
  "frames.addImage": "Add image",
  "frames.endFrame": "End frame",
  "frames.removeStart": "Remove start frame",
  "frames.removeEnd": "Remove end frame",
  "frames.hintChooseModel": "Choose a model first — frame guidance depends on its capabilities",
  "frames.hintGuides": "First frame guidance — the video starts from this image",
  "frames.hintEndGuides": "Last frame guidance — the video ends on this image",
  "frames.hintNoSupport": "{model} does not report image→video support",
  "frames.hintEndNoSupport": "{model} does not report end-frame support",

  // Inspector
  "inspector.title": "Inspector",
  "inspector.draft": "Draft",
  "inspector.model": "Model",
  "inspector.video": "Video",
  "inspector.resolution": "Resolution",
  "inspector.aspectRatio": "Aspect ratio",
  "inspector.duration": "Duration",
  "inspector.generation": "Generation",
  "inspector.seed": "Seed",
  "inspector.seedRandom": "Random",
  "inspector.seedClearAria": "Clear seed (use random)",
  "inspector.seedBackToRandom": "Back to random",
  "inspector.seedRollAria": "Roll a random seed",
  "inspector.seedRoll": "Roll a seed to pin",
  "inspector.audio": "Audio",
  "inspector.audioAria": "Generate audio",
  "inspector.creativeControls": "Creative controls",
  "inspector.output": "Output",
  "inspector.rate": "Price",
  "inspector.rateHint":
    "The provider's published price per second of video for the selected configuration.",
  "inspector.estCost": "Est. cost",
  "inspector.actualCost": "Actual cost",
  "inspector.actualCostHint": "Appears after a completed generation",
  "inspector.provider": "Provider",
  "inspector.status": "Status",
  "inspector.ready": "Ready",
  "inspector.planned": "{seconds}s planned",
  "inspector.catalogPrice": "Catalog price {price}.",
  "inspector.priceUnavailable": "Price unavailable.",
  "inspector.customOption": "{value} (custom)",
  "inspector.unknown": "Unknown",

  // Pricing labels & estimate states (shared by inspector, status bar, model cards)
  "price.perSecond": "{amount}/s",
  "price.perSecondFrom": "from {amount}/s",
  "price.perRequest": "{amount}/video",
  "estimate.noModel": "No model selected yet.",
  "estimate.noDuration": "Set a duration to see the price.",
  "estimate.needsResolution": "The price depends on resolution — pick one to see it.",
  "estimate.needsAspectRatio": "The price depends on aspect ratio — pick one to see it.",
  "estimate.needsAudio": "The price depends on audio — turn it on or off to see it.",
  "estimate.noPriceForFormat": "No published price matches the selected format.",
  "estimate.noPriceForNamedFormat": "No published price for {format}.",
  "estimate.noPricing": "The provider publishes no pricing for this model.",
  "inspector.backToDraft": "Back to draft",
  "inspector.promptGroup": "Prompt",
  "inspector.settingsGroup": "Settings",
  "inspector.noPrompt": "(no prompt)",
  "inspector.notGenerated": "Not generated",
  "inspector.fileSize": "File size",
  "inspector.immutableNote":
    "Every take is saved exactly as it was generated — its prompt, settings and result never change.",
  "chips.textToVideo": "Text→Video",
  "chips.imageToVideo": "Image→Video",
  "chips.startEnd": "Start→End",
  "chips.negativePrompt": "Negative",
  "chips.audio": "Audio",
  "chips.seed": "Seed",

  // Generation phases / job statuses
  "phase.queued": "Queued",
  "phase.generating": "Generating",
  "phase.downloading": "Downloading",
  "phase.completed": "Completed",
  "phase.failed": "Failed",
  "phase.canceled": "Canceled",
  "status.ready": "Ready",

  // Takes panel
  "takes.title": "Takes",
  "takes.selectHint": "Select a take to see how it was made",
  "takes.empty":
    "No takes yet. Press Generate — every take of this scene is kept here, with the exact prompt and settings that made it.",
  "takes.hidden.one": "{count} take could not be shown.",
  "takes.hidden.other": "{count} takes could not be shown.",
  "takes.operation.remix": "Remix",
  "takes.operation.retake": "Retake",
  "takes.operation.extend": "Extend",
  "take.number": "Take {number}",

  // Take preview
  "preview.selectHint": "Select a take on the left to preview it here.",
  "preview.noVideo": "No video yet — press Generate",
  "preview.cantPreview": "The video exists but cannot be previewed in this session.",
  "preview.seed": "seed {seed}",
  "preview.seedRandom": "seed random",
  "common.preview": "Preview",
  "common.download": "Download",
  "common.openLocation": "Open location",
  "common.copyPrompt": "Copy prompt",
  "preview.hintNoVideo": "{action} · no video yet",
  "preview.hintOnDisk": "Open location · available for files on disk",

  // Model picker
  "model.chooseTitle": "Choose a model",
  "model.dialogDescription":
    "{count} video models available to your account, with live catalog prices.",
  "model.search": "Search models…",
  "model.searchAria": "Search models",
  "model.noMatch": 'No models match "{query}".',
  "model.connectFirst": "Connect OpenRouter to load models",
  "model.loadError": "Couldn't load the model catalog.",
  "model.emptyCatalog": "The catalog lists no video-capable models for this account.",
  "model.notInCatalog": "not in catalog",
  "model.choosePlaceholder": "Choose a model…",
  "model.chooseAria": "Choose a model",
  "model.priceUnavailable": "Price unavailable",
  "model.badgeFast": "Fast",
  "model.badgeExperimental": "Experimental",
  "model.badgeNew": "New",

  // Duration input
  "duration.placeholder": "e.g. 8 or 1:30",
  "duration.invalid": 'Can\'t read that — try seconds ("8") or time ("1:30").',
  "duration.unsupported": "Model reports supported durations only — your value is kept as typed.",

  // Library
  "library.title": "Library",
  "library.description": "Every video you generate, across all projects — play, download, reuse.",
  "library.search": "Search videos…",
  "library.clips.one": "{count} clip",
  "library.clips.other": "{count} clips",
  "library.noMatches": "No matches",
  "library.noMatchesDescription": 'No videos match "{query}".',
  "library.empty": "No videos yet",
  "library.emptyDescription":
    "Every generated clip lands here automatically. Open a project, write a prompt and press Generate.",
  "library.openProjects": "Open projects",
  "library.loadError": "Couldn't load the library",
  "library.videoActions": "Video actions",
  "library.untitledScene": "Untitled scene",
  "library.open": "Open {title}",

  // Preferences
  "settings.title": "Preferences",
  "settings.description": "Connect your provider and choose which models the studio can use.",
  "settings.language": "Language",
  "settings.languageDescription": "The language of the interface.",
  "settings.provider.backend": "Generation backend.",
  "settings.provider.manageKeys": "Manage keys",
  "settings.provider.apiKey": "API key",
  "settings.provider.connect": "Connect",
  "settings.provider.invalidKey": "This does not look like an OpenRouter API key.",
  "settings.provider.keyNote":
    "The key is validated against OpenRouter before being stored locally on this device. It never leaves your machine otherwise.",
  "settings.provider.label": "Label",
  "settings.provider.balance": "Balance",
  "settings.provider.usage": "Lifetime usage",
  "settings.provider.freeTier": "Free tier",
  "settings.provider.refresh": "Refresh",
  "settings.provider.disconnect": "Disconnect",
  "settings.models.title": "Video models",
  "settings.models.description":
    "Every video model available to your account, with live catalog prices.",
  "settings.models.connectFirst": "Connect OpenRouter to load models.",
  "settings.models.loadError": "Could not load the model catalog. {message}",
  "settings.models.empty": "The catalog currently lists no video-capable models for this account.",

  // Provider connection states
  "connection.connected.label": "Connected",
  "connection.connected.description": "OpenRouter is connected and ready.",
  "connection.connecting.label": "Connecting…",
  "connection.connecting.description": "Checking the API key…",
  "connection.invalidKey.label": "Invalid key",
  "connection.invalidKey.description": "OpenRouter rejected the API key.",
  "connection.rateLimited.label": "Rate limited",
  "connection.rateLimited.description": "Too many requests — try again shortly.",
  "connection.rateLimited.retryIn": "Too many requests — retry in ~{seconds}s.",
  "connection.offline.label": "Offline",
  "connection.offline.description": "OpenRouter is unreachable. Check your connection.",
  "connection.error.label": "Error",
  "connection.disconnected.label": "Not connected",
  "connection.disconnected.description": "Add an OpenRouter API key in Preferences to connect.",

  // Generation failures (looked up by stable failure code)
  "failure.AUTHENTICATION":
    "OpenRouter rejected the API key. Reconnect the provider in Preferences.",
  "failure.RATE_LIMITED": "The provider is rate-limiting requests. Try again shortly.",
  "failure.TIMEOUT": "The provider did not respond in time. Check your connection and retry.",
  "failure.NETWORK":
    "Network problem while talking to the provider. Check your connection and retry.",
  "failure.INSUFFICIENT_CREDITS":
    "Not enough OpenRouter credits for this generation. Top up and retry.",
  "failure.GENERATION_FAILED": "The provider could not generate this video.",

  // About dialog
  "about.version": "Version {version}",
  "about.footer": "Video generation via OpenRouter · Built with Tauri",
  "about.copyright": "© {year} Little Studio",

  // Router fallbacks
  "notFound.title": "Page not found",
  "notFound.description":
    "This view doesn't exist. Head back to your projects and continue creating.",
  "notFound.back": "Back to projects",
  "errorBoundary.title": "Something went wrong",
  "errorBoundary.unexpected": "An unexpected error occurred.",
  "errorBoundary.reload": "Reload app",
} as const;

export type MessageKey = keyof typeof en;
