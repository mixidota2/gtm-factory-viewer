#!/usr/bin/env bash
# Use Ubuntu's signed archive directly, not the runner's regional mirror list.
# APT retains signature, package-hash and TLS verification. No global sources change.
set -euo pipefail
work=$(mktemp -d)
trap 'sudo rm -rf -- "$work"' EXIT
chmod 755 "$work"
mkdir -p "$work/lists/partial" "$work/archives/partial"
cat > "$work/ubuntu.sources" <<'SOURCES'
Types: deb
URIs: https://archive.ubuntu.com/ubuntu
Suites: noble
Components: main
Architectures: amd64
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
SOURCES
apt_options=(
  -o "Dir::Etc::sourcelist=$work/ubuntu.sources"
  -o 'Dir::Etc::sourceparts=-'
  -o "Dir::State::lists=$work/lists"
  -o "Dir::Cache::archives=$work/archives"
  -o 'Acquire::Languages=none'
  -o 'Acquire::Retries=1'
  -o 'Acquire::https::Timeout=30'
  -o 'APT::Update::Error-Mode=any'
)
mkdir -p browser-evidence
cp "$work/ubuntu.sources" browser-evidence/font-source.sources
sudo timeout --signal=TERM --kill-after=10s 90s apt-get "${apt_options[@]}" update
sudo timeout --signal=TERM --kill-after=10s 240s apt-get "${apt_options[@]}" --download-only --reinstall --no-install-recommends -y install 'fonts-noto-cjk=1:20230817+repack1-3'
sha256sum "$work"/archives/fonts-noto-cjk_*.deb | sed "s|$work/archives/||" > browser-evidence/font-package.sha256
sudo apt-get "${apt_options[@]}" --no-download --no-install-recommends -y install 'fonts-noto-cjk=1:20230817+repack1-3'
fc-cache -f
dpkg-query -W fonts-noto-cjk | tee browser-evidence/font-package.txt
