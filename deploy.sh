#!/usr/bin/env bash
set -euo pipefail

### ── KULLANIM ────────────────────────────────────────────────────────────────
# 1) Bu dosyayı proje köküne (package.json ile aynı yere) kaydedin.
# 2) izin verin:  chmod +x deploy.sh
# 3) çalıştırın:  ./deploy.sh
#
# Opsiyonel ortam değişkenleri:
#   BUCKET             : S3 bucket adı (varsayılan: auxite-wallet-web-809278147371-prod)
#   DISTRIBUTION_ID    : CloudFront Distribution ID (boşsa invalidation atlanır)
#   AWS_REGION         : AWS bölgesi (ör. eu-central-1). set edilmemişse AWS CLI profili varsayılanı kullanılır.
#   NPM_CMD            : npm komutu (npm i yerine npm ci istiyorsanız NPM_CMD="ci")
###############################################################################

# ── Ayarlar (istediğinde değiştir) ───────────────────────────────────────────
BUCKET="${BUCKET:-auxite-wallet-web-809278147371-prod}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-}"
NPM_CMD="${NPM_CMD:-install}"

echo "🔎 Proje dizini: $(pwd)"
if [[ ! -f package.json ]]; then
  echo "❌ package.json bulunamadı. Lütfen proje kökünde çalıştırın." >&2
  exit 1
fi

# next.config.ts kontrolü (output: "export" olmalı)
if ! grep -q 'output: *"export"' next.config.* 2>/dev/null; then
  echo "❌ next.config.ts içinde output:\"export\" bulunamadı. Statik export için gerekli." >&2
  exit 2
fi

# AWS CLI kontrolü
if ! command -v aws >/dev/null 2>&1; then
  echo "❌ AWS CLI yüklü değil. Lütfen AWS CLI kurun ve 'aws configure' yapın." >&2
  exit 3
fi

# Node / npm kontrolü (bilgilendirme)
echo "🟢 Node: $(node -v 2>/dev/null || echo 'yok')  |  npm: $(npm -v 2>/dev/null || echo 'yok')"

# Temizlik
echo "🧹 Temizliyor: .next/ ve out/"
rm -rf .next out

# Kurulum
echo "📦 Bağımlılıklar kuruluyor: npm ${NPM_CMD}"
npm ${NPM_CMD}

# Build
echo "🏗️  Build (Next static export)"
npm run build

# out/ oluştu mu?
if [[ ! -d out ]]; then
  echo "❌ out/ klasörü oluşmadı. Build başarısız." >&2
  exit 4
fi

# S3 sync (genel içerik 5dk cache)
echo "🚀 S3 senkronizasyonu → s3://${BUCKET}"
aws s3 sync ./out "s3://${BUCKET}" --delete --cache-control "public,max-age=300"

# _next/static için uzun cache (1 yıl, immutable)
if [[ -d out/_next/static ]]; then
  echo "📦 _next/static uzun cache ile yükleniyor"
  aws s3 cp --recursive ./out/_next/static "s3://${BUCKET}/_next/static" \
    --cache-control "public,max-age=31536000,immutable"
fi

# CloudFront invalidate (varsa)
if [[ -n "${DISTRIBUTION_ID}" ]]; then
  echo "🧼 CloudFront invalidation: ${DISTRIBUTION_ID}"
  aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*" >/dev/null
  echo "✅ Invalidation gönderildi."
else
  echo "ℹ️  DISTRIBUTION_ID set edilmedi; invalidation atlandı."
fi

echo "✅ Dağıtım tamamlandı. Bucket: s3://${BUCKET}"

