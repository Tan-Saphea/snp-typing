!macro preInit
  ; Ensure running instances of SNP Typing are cleanly closed before the installer replaces files
  nsExec::Exec 'taskkill /F /IM "SNP Typing.exe"'
  Pop $0
!macroend

!macro customInit
  ; Terminate any running instances so files are not locked
  nsExec::Exec 'taskkill /F /IM "SNP Typing.exe"'
  Pop $0

  ; If INSTDIR is not already set from canonical GUID, check intermediate registry key
  ${If} $INSTDIR == ""
  ${OrIf} $INSTDIR == "$LocalAppData\Programs\SNP Typing"
    ReadRegStr $0 HKCU "Software\org.snp.typing" "InstallLocation"
    ${If} $0 != ""
      StrCpy $INSTDIR $0
    ${EndIf}
  ${EndIf}
!macroend

!macro customInstall
  ; Clean up legacy duplicate registry keys if upgrading from intermediate builds
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\org.snp.typing"
  DeleteRegKey HKCU "Software\org.snp.typing"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\org.snp.typing"
  DeleteRegKey HKLM "Software\org.snp.typing"
!macroend
