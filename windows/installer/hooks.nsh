; „Öffnen mit → BookLedgerPro“ für Belege und Mails, nur für diesen Benutzer. Ändert keine Standard-Zuordnung.
!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe" "FriendlyAppName" "BookLedgerPro"
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe\shell\open\command" "" '$\"$INSTDIR\bookledgerpro.exe$\" $\"%1$\"'
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe\DefaultIcon" "" '$\"$INSTDIR\bookledgerpro.exe$\",0'
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe\SupportedTypes" ".pdf" ""
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe\SupportedTypes" ".eml" ""
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe\SupportedTypes" ".png" ""
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe\SupportedTypes" ".jpg" ""
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe\SupportedTypes" ".jpeg" ""
  WriteRegStr HKCU "Software\Classes\Applications\bookledgerpro.exe\SupportedTypes" ".xml" ""
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\Applications\bookledgerpro.exe"
!macroend
