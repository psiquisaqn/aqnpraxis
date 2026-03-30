$base = "C:\Users\abaez\OneDrive\Documentos\aqnpraxis\aqnpraxis"

$files = @(
  "$base\app\dashboard\components\NewPatientModal.tsx",
  "$base\app\dashboard\components\NewSessionModal.tsx",
  "$base\app\dashboard\components\PatientList.tsx",
  "$base\app\dashboard\paciente\[id]\EditPatientModal.tsx",
  "$base\app\dashboard\paciente\[id]\ProgramsTab.tsx",
  "$base\app\dashboard\paciente\[id]\nueva-sesion-dual\page.tsx",
  "$base\app\dashboard\paciente\[id]\session\[sessionId]\dual-setup\page.tsx",
  "$base\app\dual-control\[dualSessionId]\finish.ts",
  "$base\app\login\page.tsx",
  "$base\app\register\page.tsx"
)

foreach ($file in $files) {
  (Get-Content -LiteralPath $file) | ForEach-Object { $_ -replace '^\s*supabase\s{2,}', '  ' } | Set-Content -LiteralPath $file
  Write-Host "OK: $file"
}

Write-Host "Listo."
