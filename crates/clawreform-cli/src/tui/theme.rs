//! Color palette for the clawREFORM forged-steel + burnished-gold brand system.

#![allow(dead_code)] // Full palette — some colors reserved for future screens.

use ratatui::style::{Color, Modifier, Style};

// ── Core Palette (dark mode for terminal) ───────────────────────────────────

pub const ACCENT: Color = Color::Rgb(204, 156, 68); // #CC9C44 — burnished gold
pub const ACCENT_DIM: Color = Color::Rgb(181, 131, 47); // #B5832F

pub const BG_PRIMARY: Color = Color::Rgb(7, 12, 21); // #070C15 — forged steel base
pub const BG_CARD: Color = Color::Rgb(27, 36, 51); // #1B2433 — elevated surface
pub const BG_HOVER: Color = Color::Rgb(34, 45, 61); // #222D3D — hover state
pub const BG_CODE: Color = Color::Rgb(15, 22, 34); // #0F1622 — code surface

pub const TEXT_PRIMARY: Color = Color::Rgb(232, 237, 244); // #E8EDF4
pub const TEXT_SECONDARY: Color = Color::Rgb(192, 204, 218); // #C0CCDA
pub const TEXT_TERTIARY: Color = Color::Rgb(130, 149, 171); // #8295AB
pub const TEXT_ON_ACCENT: Color = Color::Rgb(18, 19, 20); // #121314

pub const BORDER: Color = Color::Rgb(66, 82, 104); // #425268

// ── Semantic Colors (brighter variants for dark background contrast) ────────

pub const GREEN: Color = Color::Rgb(87, 211, 155); // #57D39B — success
pub const BLUE: Color = Color::Rgb(120, 176, 255); // #78B0FF — info
pub const YELLOW: Color = Color::Rgb(242, 187, 88); // #F2BB58 — warning
pub const RED: Color = Color::Rgb(240, 113, 120); // #F07178 — error
pub const PURPLE: Color = Color::Rgb(177, 140, 255); // #B18CFF — accent-2

// ── Backward-compat aliases ─────────────────────────────────────────────────

pub const CYAN: Color = BLUE;
pub const DIM: Color = TEXT_SECONDARY;

// ── Reusable styles ─────────────────────────────────────────────────────────

pub fn title_style() -> Style {
    Style::default().fg(ACCENT).add_modifier(Modifier::BOLD)
}

pub fn selected_style() -> Style {
    Style::default().fg(ACCENT).bg(BG_HOVER)
}

pub fn dim_style() -> Style {
    Style::default().fg(TEXT_SECONDARY)
}

pub fn input_style() -> Style {
    Style::default().fg(ACCENT).add_modifier(Modifier::BOLD)
}

pub fn hint_style() -> Style {
    Style::default().fg(TEXT_TERTIARY)
}

// ── Tab bar styles ──────────────────────────────────────────────────────────

pub fn tab_active() -> Style {
    Style::default()
        .fg(TEXT_ON_ACCENT)
        .bg(ACCENT)
        .add_modifier(Modifier::BOLD)
}

pub fn tab_inactive() -> Style {
    Style::default().fg(TEXT_SECONDARY)
}

// ── State badge styles ──────────────────────────────────────────────────────

pub fn badge_running() -> Style {
    Style::default().fg(GREEN).add_modifier(Modifier::BOLD)
}

pub fn badge_created() -> Style {
    Style::default().fg(BLUE).add_modifier(Modifier::BOLD)
}

pub fn badge_suspended() -> Style {
    Style::default().fg(YELLOW).add_modifier(Modifier::BOLD)
}

pub fn badge_terminated() -> Style {
    Style::default().fg(TEXT_TERTIARY)
}

pub fn badge_crashed() -> Style {
    Style::default().fg(RED).add_modifier(Modifier::BOLD)
}

/// Return badge text + style for an agent state string.
pub fn state_badge(state: &str) -> (&'static str, Style) {
    let lower = state.to_lowercase();
    if lower.contains("run") {
        ("[RUN]", badge_running())
    } else if lower.contains("creat") || lower.contains("new") || lower.contains("idle") {
        ("[NEW]", badge_created())
    } else if lower.contains("sus") || lower.contains("paus") {
        ("[SUS]", badge_suspended())
    } else if lower.contains("term") || lower.contains("stop") || lower.contains("end") {
        ("[END]", badge_terminated())
    } else if lower.contains("err") || lower.contains("crash") || lower.contains("fail") {
        ("[ERR]", badge_crashed())
    } else {
        ("[---]", dim_style())
    }
}

// ── Table / channel styles ──────────────────────────────────────────────────

pub fn table_header() -> Style {
    Style::default()
        .fg(ACCENT)
        .add_modifier(Modifier::BOLD | Modifier::UNDERLINED)
}

pub fn channel_ready() -> Style {
    Style::default().fg(GREEN).add_modifier(Modifier::BOLD)
}

pub fn channel_missing() -> Style {
    Style::default().fg(YELLOW)
}

pub fn channel_off() -> Style {
    dim_style()
}

// ── Spinner ─────────────────────────────────────────────────────────────────

pub const SPINNER_FRAMES: &[&str] = &[
    "\u{280b}", "\u{2819}", "\u{2839}", "\u{2838}", "\u{283c}", "\u{2834}", "\u{2826}", "\u{2827}",
    "\u{2807}", "\u{280f}",
];
