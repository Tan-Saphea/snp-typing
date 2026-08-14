# SNP Typing Windows Setup

## Build the installer

The renderer API address is compiled into the application. Set `NEXT_PUBLIC_API_URL` in `client/.env` to the HTTPS production API before making a public release. The current development value points to `http://localhost:5001/api`.

From the repository root:

```bash
npm install
npm test
npm run dist:win
```

The finished x64 installer is written to:

```text
release/SNP-Typing-Setup.exe
```

The application uses `build/icon.png`, and the setup/uninstaller wizard uses the multi-resolution `build/icon.ico`. Both contain the SNP school logo. Release binaries are ignored by Git because the installer is larger than GitHub's normal source-file limit; upload it as a GitHub Release asset instead.

## Install on Windows

1. Download `SNP-Typing-Setup.exe` from the GitHub release.
2. Double-click the installer.
3. If Windows SmartScreen appears for an unsigned build, verify the publisher/source before choosing **More info** and **Run anyway**.
4. Choose whether to install for the current user or all users. Current-user installation does not normally require administrator access.
5. Choose the installation folder.
6. Keep the desktop and Start Menu shortcuts selected, then choose **Install**.
7. Choose **Finish** to open SNP Typing.

The configured API must be reachable when the application opens. For a public installer, use a deployed HTTPS API rather than localhost.

## Uninstall completely

1. Open **Windows Settings**.
2. Go to **Apps > Installed apps**.
3. Find **SNP Typing**.
4. Select the menu beside it and choose **Uninstall**.
5. Confirm the uninstall wizard.

The uninstaller removes the installed program, shortcuts, and SNP Typing's local desktop data. Learner results stored on the server are not deleted and become available again after reinstalling and signing in.

## Upgrade

Run a newer `SNP-Typing-Setup.exe`. The stable application ID `org.snp.typing` lets NSIS replace the installed version without creating a second application entry.
