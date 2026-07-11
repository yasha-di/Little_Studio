use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    // Media library: video files on disk, save-as dialog, reveal in Explorer.
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .targets([
          Target::new(TargetKind::Stdout),
          // Persistent log file in the platform log directory
          // (%LOCALAPPDATA%/com.littlestudio.desktop/logs on Windows).
          Target::new(TargetKind::LogDir {
            file_name: Some("little-studio".into()),
          }),
          // Forward webview console output into the same sinks.
          Target::new(TargetKind::Webview),
        ])
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
