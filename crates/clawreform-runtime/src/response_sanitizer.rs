//! Helpers for cleaning provider-specific wrapper text from user-visible responses.

/// Remove hidden reasoning tags and normalize spacing for user-visible text.
pub fn sanitize_visible_response(text: &str) -> String {
    let mut cleaned = text.to_string();
    for tag in ["think", "thinking"] {
        cleaned = strip_tagged_block(&cleaned, tag);
    }
    collapse_blank_lines(cleaned.trim())
}

fn strip_tagged_block(text: &str, tag: &str) -> String {
    let open = format!("<{tag}>");
    let close = format!("</{tag}>");
    let mut remaining = text;
    let mut out = String::new();

    while let Some(start) = remaining.find(&open) {
        out.push_str(&remaining[..start]);
        let after_open = &remaining[start + open.len()..];
        if let Some(end) = after_open.find(&close) {
            remaining = &after_open[end + close.len()..];
        } else {
            remaining = &remaining[..start];
            break;
        }
    }

    out.push_str(remaining);
    out
}

fn collapse_blank_lines(text: &str) -> String {
    let mut out = String::new();
    let mut previous_blank = false;
    for line in text.lines() {
        let is_blank = line.trim().is_empty();
        if is_blank && previous_blank {
            continue;
        }
        if !out.is_empty() {
            out.push('\n');
        }
        if !is_blank {
            out.push_str(line.trim_end());
        }
        previous_blank = is_blank;
    }
    out.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::sanitize_visible_response;

    #[test]
    fn strips_think_block_and_keeps_visible_text() {
        let input = "<think>\nprivate\n</think>\n\nVisible answer.";
        assert_eq!(sanitize_visible_response(input), "Visible answer.");
    }

    #[test]
    fn strips_multiple_reasoning_blocks() {
        let input =
            "Before\n<think>hidden</think>\nMiddle\n<thinking>also hidden</thinking>\nAfter";
        assert_eq!(sanitize_visible_response(input), "Before\nMiddle\nAfter");
    }

    #[test]
    fn collapses_extra_blank_lines_after_stripping() {
        let input = "<think>hidden</think>\n\n\nLine one.\n\n\nLine two.";
        assert_eq!(sanitize_visible_response(input), "Line one.\n\nLine two.");
    }
}
