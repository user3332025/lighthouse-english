param(
  [Parameter(Mandatory = $true)][string]$SourcePath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$MaxSize = 420,
  [int]$JpegQuality = 82
)

Add-Type -AssemblyName System.Drawing

$image = [System.Drawing.Image]::FromFile($SourcePath)
try {
  $ratio = [Math]::Min($MaxSize / $image.Width, $MaxSize / $image.Height)
  if ($ratio -gt 1) {
    $ratio = 1
  }

  $targetWidth = [Math]::Max(1, [int][Math]::Round($image.Width * $ratio))
  $targetHeight = [Math]::Max(1, [int][Math]::Round($image.Height * $ratio))
  $extension = [System.IO.Path]::GetExtension($OutputPath).ToLowerInvariant()

  if ($extension -eq ".jpg" -or $extension -eq ".jpeg") {
    $bitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
  } else {
    $bitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  }

  try {
    $bitmap.SetResolution(96, 96)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.DrawImage($image, 0, 0, $targetWidth, $targetHeight)
    } finally {
      $graphics.Dispose()
    }

    $directory = [System.IO.Path]::GetDirectoryName($OutputPath)
    if (-not [System.IO.Directory]::Exists($directory)) {
      [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    }

    if ($extension -eq ".jpg" -or $extension -eq ".jpeg") {
      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" } | Select-Object -First 1
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$JpegQuality)
      $bitmap.Save($OutputPath, $codec, $encoderParams)
      $encoderParams.Dispose()
    } else {
      $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
  } finally {
    $bitmap.Dispose()
  }
} finally {
  $image.Dispose()
}
