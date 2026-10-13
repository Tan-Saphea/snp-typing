# SNP Typing Windows Setup

## Build the installer

The Windows desktop application includes its own local account, curriculum, result, progress, leaderboard, and settings service. It does not require MongoDB, the Express API, or internet access. Browser development continues to use `NEXT_PUBLIC_API_URL` and the normal server.

From the repository root:

```bash
npm install
npm test
npm run dist:win
```

The finished x64 binaries are written to:

```text
release/SNP-Typing-Portable.exe
release/SNP-Typing-Setup.exe
release/SNP-Typing-v0.1.3-win-x64.zip
```

The application uses `build/icon.png`, and the setup/uninstaller wizard uses the multi-resolution `build/icon.ico`. Both contain the SNP school logo. Release binaries are ignored by Git because the files exceed GitHub repository limits; upload them as GitHub Release assets instead.

## Available Windows Packages

### 1. Portable Standalone Executable (SNP-Typing-Portable.exe)
- Zero installation required and does not require Administrator permissions.
- Double-click to launch SNP Typing directly.
- Automatically connects to existing student accounts and progress in `%APPDATA%\SNP Typing\offline-data.json`.

### 2. Direct Application Folder (SNP-Typing-v0.1.3-win-x64.zip)
- Direct zip archive of the application files.
- Can be extracted anywhere to run `SNP Typing.exe` portably.
- Can be copied directly into `C:\Program Files\SNP Typing` to update in-place without running setup wizards.

### 3. Standard Installer (SNP-Typing-Setup.exe)
- Standard NSIS installer that installs to `C:\Program Files\SNP Typing` (all users) and updates Desktop and Start Menu shortcuts.
- Requires Administrator elevation for `C:\Program Files\`.
- Preserves all student accounts and progress across updates.

## Upgrading an Existing Installation

1. **Option A (Zero-Setup Portable)**: Download `SNP-Typing-Portable.exe` and launch it directly. All existing student data and progress remain intact.
2. **Option B (Direct Folder Overwrite)**: Close SNP Typing, extract `SNP-Typing-v0.1.3-win-x64.zip`, and copy the contents of `SNP Typing` into `C:\Program Files\SNP Typing` selecting "Replace files".
3. **Option C (Installer Upgrade)**: Close any running instances of SNP Typing. If a previous installer process is suspended in the background, terminate `SNP-Typing-Setup.exe` in Windows Task Manager, then right-click `SNP-Typing-Setup.exe` and choose "Run as administrator".

## Student Data Preservation

All student accounts, progress, stars, and typing test records are preserved in `%APPDATA%\SNP Typing\offline-data.json`. Automatic `.bak` safety backups and fallback paths guarantee data safety across versions.

