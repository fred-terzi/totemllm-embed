export const CHAT_UI_REOPEN = "___totem_llm_chat_widget_open___";
export function parseStylesSrc(scriptSrc = null) {
  try {
    const _url = new URL(scriptSrc);
    _url.pathname = _url.pathname
      .replace("totem-chat-widget.js", "totem-chat-widget.min.css")
      .replace(
        "totem-chat-widget.min.js",
        "totem-chat-widget.min.css"
      );
    return _url.toString();
  } catch {
    return "";
  }
}
