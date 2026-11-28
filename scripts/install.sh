#!/usr/bin/env bash
# clawREFORM installer — works on Linux, macOS, WSL
# Usage: curl -sSf https://clawreform.sh/install | sh
#
# Environment variables:
#   CLAWREFORM_INSTALL_DIR  — custom install directory (default: ~/.clawreform/bin)
#   CLAWREFORM_VERSION      — install a specific version tag (default: latest)

set -euo pipefail

REPO="${CLAWREFORM_REPO:-aegntic/clawreform}"
INSTALL_DIR="${CLAWREFORM_INSTALL_DIR:-${OPENFANG_INSTALL_DIR:-$HOME/.clawreform/bin}}"
TARGET_VERSION="${CLAWREFORM_VERSION:-${OPENFANG_VERSION:-}}"

detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64|amd64) ARCH="x86_64" ;;
        aarch64|arm64) ARCH="aarch64" ;;
        *) echo "  Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    case "$OS" in
        linux) PLATFORM="${ARCH}-unknown-linux-gnu" ;;
        darwin) PLATFORM="${ARCH}-apple-darwin" ;;
        mingw*|msys*|cygwin*)
            echo ""
            echo "  For Windows, use PowerShell instead:"
            echo "    irm https://clawreform.sh/install.ps1 | iex"
            echo ""
            echo "  Or download the .msi installer from:"
            echo "    https://github.com/$REPO/releases/latest"
            echo ""
            echo "  Or install via cargo:"
            echo "    cargo install --git https://github.com/$REPO clawreform-cli"
            exit 1
            ;;
        *) echo "  Unsupported OS: $OS"; exit 1 ;;
    esac
}

install() {
    detect_platform

    echo ""
    echo "  clawREFORM Installer"
    echo "  ===================="
    echo ""

    # Get latest version
    if [ -n "$TARGET_VERSION" ]; then
        VERSION="$TARGET_VERSION"
        echo "  Using specified version: $VERSION"
    else
        echo "  Fetching latest release..."
        VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | head -1 | cut -d '"' -f 4)
    fi

    if [ -z "$VERSION" ]; then
        echo "  Could not determine latest version."
        echo "  Install from source instead:"
        echo "    cargo install --git https://github.com/$REPO clawreform-cli"
        exit 1
    fi

    URL="https://github.com/$REPO/releases/download/$VERSION/clawreform-$PLATFORM.tar.gz"
    CHECKSUM_URL="$URL.sha256"

    echo "  Installing clawREFORM $VERSION for $PLATFORM..."
    mkdir -p "$INSTALL_DIR"

    # Download to temp
    TMPDIR=$(mktemp -d)
    ARCHIVE="$TMPDIR/clawreform.tar.gz"
    CHECKSUM_FILE="$TMPDIR/checksum.sha256"

    cleanup() { rm -rf "$TMPDIR"; }
    trap cleanup EXIT

    if ! curl -fsSL "$URL" -o "$ARCHIVE" 2>/dev/null; then
        echo "  Download failed. The release may not exist for your platform."
        echo "  Install from source instead:"
        echo "    cargo install --git https://github.com/$REPO clawreform-cli"
        exit 1
    fi

    # Verify checksum if available
    if curl -fsSL "$CHECKSUM_URL" -o "$CHECKSUM_FILE" 2>/dev/null; then
        EXPECTED=$(cut -d ' ' -f 1 < "$CHECKSUM_FILE")
        if command -v sha256sum &>/dev/null; then
            ACTUAL=$(sha256sum "$ARCHIVE" | cut -d ' ' -f 1)
        elif command -v shasum &>/dev/null; then
            ACTUAL=$(shasum -a 256 "$ARCHIVE" | cut -d ' ' -f 1)
        else
            ACTUAL=""
        fi
        if [ -n "$ACTUAL" ]; then
            if [ "$EXPECTED" != "$ACTUAL" ]; then
                echo "  Checksum verification FAILED!"
                echo "    Expected: $EXPECTED"
                echo "    Got:      $ACTUAL"
                exit 1
            fi
            echo "  Checksum verified."
        else
            echo "  No sha256sum/shasum found, skipping checksum verification."
        fi
    fi

    # Extract
    tar xzf "$ARCHIVE" -C "$INSTALL_DIR"
    chmod +x "$INSTALL_DIR/clawreform"

    # Add to PATH
    SHELL_RC=""
    case "${SHELL:-}" in
        */zsh) SHELL_RC="$HOME/.zshrc" ;;
        */bash) SHELL_RC="$HOME/.bashrc" ;;
        */fish) SHELL_RC="$HOME/.config/fish/config.fish" ;;
    esac

    if [ -n "$SHELL_RC" ] && ! grep -q "clawreform" "$SHELL_RC" 2>/dev/null; then
        case "${SHELL:-}" in
            */fish)
                mkdir -p "$(dirname "$SHELL_RC")"
                echo "set -gx PATH \"$INSTALL_DIR\" \$PATH" >> "$SHELL_RC"
                ;;
            *)
                echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$SHELL_RC"
                ;;
        esac
        echo "  Added $INSTALL_DIR to PATH in $SHELL_RC"
    fi

    # Verify installation
    if "$INSTALL_DIR/clawreform" --version >/dev/null 2>&1; then
        INSTALLED_VERSION=$("$INSTALL_DIR/clawreform" --version 2>/dev/null || echo "$VERSION")
        echo ""
        echo "  clawREFORM installed successfully! ($INSTALLED_VERSION)"
    else
        echo ""
        echo "  clawREFORM binary installed to $INSTALL_DIR/clawreform"
    fi

    echo ""
    echo "  Get started:"
    echo "    clawreform init"
    echo ""
    echo "  The setup wizard will guide you through provider selection"
    echo "  and configuration."
    echo ""
}

install
