param(
  [string]$AssetsPath = (Join-Path $PSScriptRoot '..\assets')
)

Add-Type -AssemblyName System.Drawing

$source = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;

public static class BalanceCenterIcon
{
    private static GraphicsPath RoundedRect(float x, float y, float width, float height, float radius)
    {
        var path = new GraphicsPath();
        var diameter = radius * 2;
        path.AddArc(x, y, diameter, diameter, 180, 90);
        path.AddArc(x + width - diameter, y, diameter, diameter, 270, 90);
        path.AddArc(x + width - diameter, y + height - diameter, diameter, diameter, 0, 90);
        path.AddArc(x, y + height - diameter, diameter, diameter, 90, 90);
        path.CloseFigure();
        return path;
    }

    private static byte[] RenderPng(int size)
    {
        using (var bitmap = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(bitmap))
        using (var stream = new MemoryStream())
        {
            graphics.SmoothingMode = SmoothingMode.AntiAlias;
            graphics.Clear(Color.Transparent);
            float scale = size / 256f;
            graphics.ScaleTransform(scale, scale);
            using (var outer = RoundedRect(16, 16, 224, 224, 54))
            using (var fill = new SolidBrush(Color.FromArgb(79, 70, 229)))
            using (var border = new Pen(Color.FromArgb(129, 140, 248), 6))
            {
                graphics.FillPath(fill, outer);
                graphics.DrawPath(border, outer);
            }
            using (var shadow = RoundedRect(50, 64, 156, 118, 26))
            using (var shadowFill = new SolidBrush(Color.FromArgb(55, 48, 163)))
            {
                graphics.FillPath(shadowFill, shadow);
            }
            using (var card = RoundedRect(42, 48, 156, 118, 26))
            using (var cardFill = new SolidBrush(Color.White))
            {
                graphics.FillPath(cardFill, card);
            }
            using (var line = new SolidBrush(Color.FromArgb(79, 70, 229)))
            using (var accent = new SolidBrush(Color.FromArgb(20, 184, 166)))
            using (var firstLine = RoundedRect(66, 78, 74, 14, 7))
            using (var secondLine = RoundedRect(66, 108, 48, 12, 6))
            {
                graphics.FillPath(line, firstLine);
                graphics.FillPath(line, secondLine);
                graphics.FillEllipse(accent, 150, 99, 28, 28);
            }
            using (var baseFill = new SolidBrush(Color.FromArgb(199, 210, 254)))
            using (var basePath = RoundedRect(67, 181, 122, 16, 8))
            {
                graphics.FillPath(baseFill, basePath);
            }
            bitmap.Save(stream, ImageFormat.Png);
            return stream.ToArray();
        }
    }

    private static byte[] RenderIconDib(int size)
    {
        var png = RenderPng(size);
        using (var pngStream = new MemoryStream(png))
        using (var bitmap = new Bitmap(pngStream))
        using (var stream = new MemoryStream())
        using (var writer = new BinaryWriter(stream))
        {
            var rowLength = size * 4;
            var maskLength = ((size + 31) / 32) * 4 * size;
            writer.Write(40);
            writer.Write(size);
            writer.Write(size * 2);
            writer.Write((short)1);
            writer.Write((short)32);
            writer.Write(0);
            writer.Write(rowLength * size);
            writer.Write(0);
            writer.Write(0);
            writer.Write(0);
            writer.Write(0);
            var bits = bitmap.LockBits(new Rectangle(0, 0, size, size), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            try
            {
                var row = new byte[rowLength];
                for (var y = size - 1; y >= 0; y--)
                {
                    Marshal.Copy(IntPtr.Add(bits.Scan0, y * bits.Stride), row, 0, row.Length);
                    writer.Write(row);
                }
            }
            finally
            {
                bitmap.UnlockBits(bits);
            }
            writer.Write(new byte[maskLength]);
            return stream.ToArray();
        }
    }

    public static void Create(string pngPath, string icoPath)
    {
        var sizes = new[] { 16, 24, 32, 48, 64, 128, 256 };
        var images = new List<byte[]>();
        foreach (var size in sizes) images.Add(RenderIconDib(size));
        Directory.CreateDirectory(Path.GetDirectoryName(pngPath));
        File.WriteAllBytes(pngPath, RenderPng(256));
        using (var stream = File.Create(icoPath))
        using (var writer = new BinaryWriter(stream))
        {
            writer.Write((short)0);
            writer.Write((short)1);
            writer.Write((short)sizes.Length);
            var offset = 6 + sizes.Length * 16;
            for (var i = 0; i < sizes.Length; i++)
            {
                writer.Write((byte)(sizes[i] == 256 ? 0 : sizes[i]));
                writer.Write((byte)(sizes[i] == 256 ? 0 : sizes[i]));
                writer.Write((byte)0);
                writer.Write((byte)0);
                writer.Write((short)1);
                writer.Write((short)32);
                writer.Write(images[i].Length);
                writer.Write(offset);
                offset += images[i].Length;
            }
            foreach (var image in images) writer.Write(image);
        }
    }
}
'@

Add-Type -TypeDefinition $source -ReferencedAssemblies System.Drawing
New-Item -ItemType Directory -Path $AssetsPath -Force | Out-Null
$pngPath = Join-Path $AssetsPath 'balance-center.png'
$icoPath = Join-Path $AssetsPath 'balance-center.ico'
[BalanceCenterIcon]::Create($pngPath, $icoPath)
