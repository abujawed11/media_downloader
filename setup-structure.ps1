# setup-structure.ps1
# Run inside mediadownloader folder

# Helper to make folders if not exists
function Ensure-Dir($path) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
    }
}

# App folders (Expo frontend)
$srcDirs = @(
    "app/(tabs)",
    "app/modals",
    "src/features/downloader/components",
    "src/features/downloader/hooks",
    "src/features/overlay",
    "src/components",
    "src/services/api",
    "src/services/files",
    "src/services/notifications",
    "src/store",
    "src/theme",
    "src/config",
    "src/utils",
    "src/types",
    "assets"
)

foreach ($d in $srcDirs) {
    Ensure-Dir $d
}

# Backend (FastAPI server)
$serverDirs = @(
    "server/app/routers",
    "server/app/services",
    "server/app/models",
    "server/app/core",
    "server/cookies"
)

foreach ($d in $serverDirs) {
    Ensure-Dir $d
}

# Create placeholder files (only if not already exist)
$files = @(
    "app/_layout.tsx",
    "app/(tabs)/_layout.tsx",
    "app/(tabs)/index.tsx",
    "app/(tabs)/downloads.tsx",
    "app/(tabs)/settings.tsx",
    "app/modals/format-picker.tsx",

    "src/features/downloader/types.ts",
    "src/features/downloader/utils.ts",
    "src/features/overlay/FloatingBubble.tsx",
    "src/features/overlay/useClipboardCapture.ts",

    "src/components/FloatingInput.tsx",
    "src/components/Button.tsx",
    "src/components/ProgressBar.tsx",

    "src/services/api/client.ts",
    "src/services/api/media.ts",
    "src/services/files/fs.ts",
    "src/services/files/paths.ts",
    "src/services/notifications/index.ts",

    "src/store/useDownloads.ts",
    "src/store/useSettings.ts",

    "src/theme/colors.ts",
    "src/theme/tailwind.css",

    "src/config/env.ts",

    "src/utils/platform.ts",
    "src/utils/mime.ts",
    "src/types/global.d.ts",

    "server/app/main.py",
    "server/app/routers/media.py",
    "server/app/services/ytdlp_service.py",
    "server/app/services/job_manager.py",
    "server/app/models/schemas.py",
    "server/app/core/settings.py",

    "server/requirements.txt",
    "server/.env.example"
)

foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        New-Item -ItemType File -Path $f | Out-Null
    }
}

Write-Host "✅ Folder structure created successfully!"
