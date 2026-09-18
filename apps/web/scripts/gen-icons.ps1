Add-Type -AssemblyName System.Drawing

function New-Icon([int]$w, [int]$h, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(37, 99, 235))
  $fontSize = [single]($w * 0.45)
  $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $rect = New-Object System.Drawing.RectangleF(0, 0, $w, $h)
  $g.DrawString('S', $font, $brush, $rect, $sf)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

New-Icon 192 192 "$PSScriptRoot\..\public\icons\icon-192.png"
New-Icon 512 512 "$PSScriptRoot\..\public\icons\icon-512.png"
Write-Output 'Iconos generados.'