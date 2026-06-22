import { useEffect, useRef, useState } from "react";
import { FaPhoneSlash } from "react-icons/fa";
import type { JitsiMeetRoomProps } from "../types/common";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const extractRoomName = (meetingRoom: string) => {
  try {
    const url = new URL(meetingRoom);
    return {
      domain: url.hostname,
      roomName: url.pathname.replace(/^\//, ""),
    };
  } catch {
    return {
      domain: "meet.jit.si",
      roomName: meetingRoom,
    };
  }
};

export const JitsiMeetRoom = ({
  meetingRoom,
  displayName,
  titleName,
  avatarName,
  onClose,
  onHangup,
}: JitsiMeetRoomProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const onCloseRef = useRef(onClose);
  const onHangupRef = useRef(onHangup);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onHangupRef.current = onHangup; }, [onHangup]);

  useEffect(() => {
    const loadJitsiScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) { resolve(); return; }
        const existingScript = document.querySelector<HTMLScriptElement>(
          'script[src="https://meet.jit.si/external_api.js"]'
        );
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve());
          existingScript.addEventListener("error", () => reject(new Error("Failed to load Jitsi script")));
          return;
        }
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Jitsi script"));
        document.head.appendChild(script);
      });

    let cancelled = false;

    loadJitsiScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const { domain, roomName } = extractRoomName(meetingRoom);

        apiRef.current = new window.JitsiMeetExternalAPI(domain, {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            p2p: { enabled: false },
            requireDisplayName: false,
            enableWelcomePage: false,
            enableClosePage: false,
            disableThirdPartyRequests: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "closedcaptions", "desktop",
              "fullscreen", "fodeviceselection", "hangup", "chat",
              "raisehand", "tileview", "select-background", "stats",
            ],
          },
        });

        const iframe = apiRef.current.getIFrame();
        if (iframe) {
          iframe.allow = "camera; microphone; display-capture; autoplay; clipboard-write; fullscreen";
        }

        apiRef.current.addEventListener("videoConferenceJoined", () => setReady(true));

        apiRef.current.addEventListener("readyToClose", async () => {
          if (onHangupRef.current) {
            await onHangupRef.current();
            return;
          }
          onCloseRef.current();
        });
      })
      .catch((err) => {
        console.error("Jitsi load error:", err);
        onCloseRef.current();
      });

    return () => {
      cancelled = true;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [meetingRoom, displayName]);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const { roomName } = extractRoomName(meetingRoom);
      window.open(`https://meet.jit.si/${roomName}`, "_blank");
      onCloseRef.current();
    }
  }, [meetingRoom]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {avatarName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">{titleName}</p>
            <p className="text-slate-400 text-xs">
              {ready ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Live
                </span>
              ) : ("Connecting…")}
            </p>
          </div>
        </div>
        <button
          onClick={() => onCloseRef.current()}
          className="flex items-center cursor-pointer gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <FaPhoneSlash /> Leave Call
        </button>
      </div>
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
};

export default JitsiMeetRoom;