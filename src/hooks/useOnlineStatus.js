import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, authAPI } from '../services/api';

export const useOnlineStatus = () => {
  const [statuses, setStatuses] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const timerRef = useRef(null);
  const lastHeartbeatTimeRef = useRef({}); // เก็บเวลาของ heartbeat ล่าสุด

  // ฟังก์ชันแปลงวินาทีเป็น HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Timer สำหรับอัปเดตเวลาแบบเรียลไทม์ (นับ 1-60)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStatuses(prevStatuses => {
        const updated = { ...prevStatuses };
        
        Object.keys(updated).forEach(userId => {
          if (updated[userId].isOnline) {
            // คำนวณเวลาแบบเรียลไทม์: heartbeatCount * 60 + วินาทีที่ผ่านไป
            const heartbeatCount = updated[userId].heartbeatCount || 0;
            const lastHeartbeatTime = lastHeartbeatTimeRef.current[userId];
            
            if (lastHeartbeatTime) {
              const secondsSinceLastHeartbeat = Math.floor((Date.now() - lastHeartbeatTime) / 1000);
              const totalSeconds = (heartbeatCount * 60) + secondsSinceLastHeartbeat;
              
              updated[userId] = {
                ...updated[userId],
                duration: totalSeconds,
                durationText: formatDuration(totalSeconds)
              };
            }
          }
        });
        return updated;
      });
    }, 1000); // อัปเดตทุก 1 วินาที

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const token = authAPI.getToken();
    if (!token) {
      setIsConnected(false);
      return;
    }

    // Create SSE connection with token in query parameter
    // Note: Some servers don't support custom headers in SSE, so we use query param
    const eventSource = new EventSource(
      `${API_BASE_URL}/status/online-status?token=${encodeURIComponent(token)}`
    );

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('[SSE] Connected to online status stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        setStatuses(prevStatuses => {
          const statusMap = {};
          const now = Date.now();
          
          data.forEach(status => {
            const userId = status.userId;
            const isNowOnline = status.isOnline;
            
            // เก็บเวลาของ heartbeat ล่าสุด
            if (status.lastHeartbeatAt) {
              lastHeartbeatTimeRef.current[userId] = new Date(status.lastHeartbeatAt).getTime();
            }
            
            let duration = 0;
            let durationText = '0:00:00';
            
            if (isNowOnline) {
              // คำนวณเวลาแบบเรียลไทม์: heartbeatCount * 60 + วินาทีที่ผ่านไป
              const heartbeatCount = status.heartbeatCount || 0;
              const secondsSinceLastHeartbeat = status.secondsSinceLastHeartbeat || 0;
              duration = (heartbeatCount * 60) + secondsSinceLastHeartbeat;
              durationText = formatDuration(duration);
            } else {
              // ใช้ totalSeconds จาก Backend เมื่อออฟไลน์
              duration = status.totalSeconds || 0;
              durationText = formatDuration(duration);
              // Clear lastHeartbeatTime เมื่อออฟไลน์
              delete lastHeartbeatTimeRef.current[userId];
            }
            
            statusMap[userId] = {
              isOnline: isNowOnline,
              lastHeartbeatAt: status.lastHeartbeatAt,
              heartbeatCount: status.heartbeatCount || 0,
              secondsSinceLastHeartbeat: status.secondsSinceLastHeartbeat || 0,
              duration: duration,
              durationText: durationText
            };
          });
          
          return statusMap;
        });
      } catch (error) {
        console.error('Error parsing status:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Error:', error);
      setIsConnected(false);
      // EventSource will automatically try to reconnect
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, []);

  return { statuses, isConnected };
};
