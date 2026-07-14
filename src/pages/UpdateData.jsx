import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Typography,
  Card,
  DatePicker,
  Space,
  Row,
  Col,
  Button,
  message,
  Tag,
  Select
} from 'antd';
const { RangePicker } = DatePicker;
import {
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import AppHeader from '../components/AppHeader';
import { statsAPI, teamsAPI } from '../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

const { Content } = Layout;
const { Title, Text } = Typography;

const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet };
};

const UpdateData = () => {
  const [stats, setStats] = useState([]);
  const [allStats, setAllStats] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [summary, setSummary] = useState({
    totalRegistrations: 0,
    totalFriends: 0,
    totalGroups: 0,
    totalMessages: 0
  });
  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  useEffect(() => {
    filterStats();
  }, [selectedTeam, allStats, dateRange]);

  const loadTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      if (response.success) {
        setTeams(response.teams || []);
      }
    } catch (error) {
      console.error('Load teams error:', error);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        
        // If same day, use getDaily API for better performance
        if (dateRange[0].isSame(dateRange[1], 'day')) {
          const response = await statsAPI.getDaily(startDate);
          if (response.success) {
            setAllStats(response.stats || []);
          }
        } else {
          // Multiple days, use getHistory API
          const response = await statsAPI.getHistory(startDate, endDate);
          if (response.success) {
            setAllStats(response.stats || []);
          }
        }
      } else {
        // Fallback to single date if range is not selected
        const dateStr = dayjs().format('YYYY-MM-DD');
        const response = await statsAPI.getDaily(dateStr);
        if (response.success) {
          setAllStats(response.stats || []);
        }
      }
    } catch (error) {
      console.error('Load stats error:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const filterStats = () => {
    let filtered = allStats;
    
    // Filter by team if selected
    if (selectedTeam !== 'all') {
      if (selectedTeam === 'no-team') {
        filtered = allStats.filter(stat => !stat.user?.team);
      } else {
        filtered = allStats.filter(stat => stat.user?.team?._id === selectedTeam);
      }
    }
    
    // Check if date range is selected (multiple days)
    const isDateRange = dateRange && dateRange[0] && dateRange[1] && 
                        !dateRange[0].isSame(dateRange[1], 'day');
    
    // If date range is selected, aggregate by user/team
    if (isDateRange && filtered.length > 0) {
      const aggregatedMap = new Map();
      
      filtered.forEach(stat => {
        const userId = stat.user?._id || stat.user;
        const key = userId || 'unknown';
        
        if (!aggregatedMap.has(key)) {
          aggregatedMap.set(key, {
            _id: stat._id || key,
            user: stat.user,
            registrationsCount: 0,
            friendsAddedCount: 0,
            groupsCreatedCount: 0,
            messagesSentCount: 0,
            updatedAt: stat.updatedAt,
            date: dateRange[0].toDate() // Use start date for display
          });
        }
        
        const aggregated = aggregatedMap.get(key);
        aggregated.registrationsCount += stat.registrationsCount || 0;
        aggregated.friendsAddedCount += stat.friendsAddedCount || 0;
        aggregated.groupsCreatedCount += stat.groupsCreatedCount || 0;
        aggregated.messagesSentCount += stat.messagesSentCount || 0;
        
        // Keep the latest updatedAt
        if (stat.updatedAt && (!aggregated.updatedAt || new Date(stat.updatedAt) > new Date(aggregated.updatedAt))) {
          aggregated.updatedAt = stat.updatedAt;
        }
      });
      
      filtered = Array.from(aggregatedMap.values());
    }
    
    setStats(filtered);
    
    const total = filtered.reduce((acc, stat) => ({
      totalRegistrations: acc.totalRegistrations + (stat.registrationsCount || 0),
      totalFriends: acc.totalFriends + (stat.friendsAddedCount || 0),
      totalGroups: acc.totalGroups + (stat.groupsCreatedCount || 0),
      totalMessages: acc.totalMessages + (stat.messagesSentCount || 0)
    }), { 
      totalRegistrations: 0, 
      totalFriends: 0, 
      totalGroups: 0, 
      totalMessages: 0
    });
    
    setSummary(total);
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange([dayjs(), dayjs()]);
    }
  };

  const handleTeamChange = (value) => {
    setSelectedTeam(value);
  };

  const handleRefresh = () => {
    loadStats();
    message.success('รีเฟรชข้อมูลแล้ว');
  };

  const handleGenerateImage = async () => {
    try {
      setLoading(true);
      
      // Check if date range is selected (multiple days)
      const isDateRange = dateRange && dateRange[0] && dateRange[1] && 
                          !dateRange[0].isSame(dateRange[1], 'day');
      
      if (isDateRange) {
        // Generate image from aggregated stats for date range
        const teamSummaryData = generateTeamSummaryFromStats(allStats);
        const startDateStr = dateRange[0].format('YYYY-MM-DD');
        const endDateStr = dateRange[1].format('YYYY-MM-DD');
        
        // Generate summary image (all teams)
        await generateTeamStatsImageRange(teamSummaryData, startDateStr, endDateStr);
        
        // Generate individual team images with user details
        const teamUserData = generateTeamUserStatsFromStats(allStats);
        for (let i = 0; i < teamUserData.length; i++) {
          await generateTeamUserStatsImageRange(teamUserData[i], startDateStr, endDateStr);
          // Add small delay between downloads to prevent browser blocking
          if (i < teamUserData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        message.success(`สร้างรูปภาพสำเร็จ (${1 + teamUserData.length} รูป)`);
      } else {
        // Single day - use existing API
        const dateStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
        const response = await statsAPI.getTeamSummary(dateStr);
        
        if (!response.success) {
          message.error('ไม่สามารถดึงข้อมูลได้');
          return;
        }

        await generateTeamStatsImage(response, dateStr);
        message.success('สร้างรูปภาพสำเร็จ');
      }
    } catch (error) {
      console.error('Generate image error:', error);
      message.error('เกิดข้อผิดพลาดในการสร้างรูปภาพ');
    } finally {
      setLoading(false);
    }
  };

  const generateTeamUserStatsFromStats = (stats) => {
    const teamMap = new Map();
    
    // Filter out stats without team
    const statsWithTeam = stats.filter(stat => stat.user?.team?.name);
    
    statsWithTeam.forEach(stat => {
      const teamName = stat.user.team.name;
      const userId = stat.user?._id || (typeof stat.user === 'string' ? stat.user : null);
      const userName = stat.user?.user || 'Unknown';
      
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          teamName,
          users: new Map()
        });
      }
      
      const team = teamMap.get(teamName);
      // Use userId as key if available, otherwise use userName
      const userKey = userId ? userId.toString() : userName;
      
      if (!team.users.has(userKey)) {
        team.users.set(userKey, {
          userName,
          registrations: 0,
          friends: 0,
          groups: 0,
          messages: 0
        });
      }
      
      const user = team.users.get(userKey);
      user.registrations += stat.registrationsCount || 0;
      user.friends += stat.friendsAddedCount || 0;
      user.groups += stat.groupsCreatedCount || 0;
      user.messages += stat.messagesSentCount || 0;
    });
    
    // Convert to array format
    const teamUserData = Array.from(teamMap.values()).map(team => ({
      teamName: team.teamName,
      users: Array.from(team.users.values()).sort((a, b) => 
        a.userName.localeCompare(b.userName)
      )
    })).sort((a, b) => a.teamName.localeCompare(b.teamName));
    
    return teamUserData;
  };

  const generateTeamSummaryFromStats = (stats) => {
    const teamMap = new Map();
    
    // Filter out stats without team
    const statsWithTeam = stats.filter(stat => stat.user?.team?.name);
    
    statsWithTeam.forEach(stat => {
      const teamName = stat.user.team.name;
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          teamName,
          total: {
            registrations: 0,
            friends: 0,
            groups: 0,
            messages: 0
          }
        });
      }
      
      const team = teamMap.get(teamName);
      team.total.registrations += stat.registrationsCount || 0;
      team.total.friends += stat.friendsAddedCount || 0;
      team.total.groups += stat.groupsCreatedCount || 0;
      team.total.messages += stat.messagesSentCount || 0;
    });
    
    const teams = Array.from(teamMap.values()).sort((a, b) => 
      a.teamName.localeCompare(b.teamName)
    );
    
    const totals = teams.reduce((acc, team) => ({
      registrations: acc.registrations + team.total.registrations,
      friends: acc.friends + team.total.friends,
      groups: acc.groups + team.total.groups,
      messages: acc.messages + team.total.messages
    }), {
      registrations: 0,
      friends: 0,
      groups: 0,
      messages: 0
    });
    
    return { teams, totals };
  };

  const generateTeamStatsImageRange = async (data, startDateStr, endDateStr) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const width = 1800;
    const rowHeight = 30;
    const headerRowHeight = 40;
    const dateHeaderHeight = 40;
    const margin = 20;
    const baseHeight = dateHeaderHeight + headerRowHeight + rowHeight + margin * 2;
    const teamRows = data.teams ? data.teams.length : 0;
    const height = baseHeight + (teamRows * rowHeight) + rowHeight; // + rowHeight for total row
    canvas.width = width;
    canvas.height = height;

    // Helper function to format numbers with decimals
    const formatNumber = (num) => {
      if (num === null || num === undefined || isNaN(num)) return '0.00';
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Helper function to format integers with comma
    const formatInteger = (num) => {
      if (num === null || num === undefined || isNaN(num)) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Colors (matching LineDaily style)
    const bgColor = '#1C1C1E';
    const cardBg = '#2C2C2E';
    const borderColor = '#48484A';
    const textPrimary = '#FFFFFF';
    const linePrimary = '#00C300';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Fonts
    const headerFont = 'bold 20px "Segoe UI"';
    const tableHeaderFont = 'bold 14px "Segoe UI"';
    const tableDataFont = '13px "Segoe UI"';
    const tableNumberFont = 'bold 13px "Segoe UI"';

    let y = 10;

    // Date header - show date range
    ctx.fillStyle = linePrimary;
    ctx.font = headerFont;
    ctx.textAlign = 'center';
    const startDate = dayjs(startDateStr).format('DD/MM/YYYY');
    const endDate = dayjs(endDateStr).format('DD/MM/YYYY');
    const dateText = `วันที่ ${startDate} - วันที่ ${endDate}`;
    ctx.fillText(dateText, width / 2, y + 20);
    y += dateHeaderHeight;

    // Table setup - 5 columns
    const tableX = 0;
    const tableWidth = width;
    const colWidths = [200, 120, 120, 120, 120];
    const totalColWidth = colWidths.reduce((a, b) => a + b, 0);

    // Adjust column widths to fit table width
    const scale = (tableWidth - 20) / totalColWidth;
    const adjustedColWidths = colWidths.map(w => Math.floor(w * scale));

    // Table header row
    ctx.fillStyle = cardBg;
    ctx.fillRect(tableX, y, tableWidth, headerRowHeight);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, y, tableWidth, headerRowHeight);

    let x = tableX;
    ctx.fillStyle = textPrimary;
    ctx.font = tableHeaderFont;
    ctx.textAlign = 'center';
    
    const headers = [
      'ชื่อทีม', 
      'เพิ่มบัญชี', 
      'เพิ่มเพื่อน', 
      'สร้างกลุ่ม', 
      'ส่งข้อความ'
    ];
    
    headers.forEach((header, i) => {
      const colCenterX = x + adjustedColWidths[i] / 2;
      ctx.fillText(header, colCenterX, y + 25);
      x += adjustedColWidths[i];
    });

    y += headerRowHeight;

    // Data rows
    data.teams.forEach((team, index) => {
      const isEven = index % 2 === 0;
      ctx.fillStyle = isEven ? cardBg : '#262628';
      ctx.fillRect(tableX, y, tableWidth, rowHeight);
      ctx.strokeRect(tableX, y, tableWidth, rowHeight);

      x = tableX;
      ctx.textAlign = 'center';
      ctx.fillStyle = textPrimary;
      ctx.font = tableDataFont;

      // Team name
      const col0CenterX = x + adjustedColWidths[0] / 2;
      ctx.fillText(team.teamName, col0CenterX, y + 22);
      x += adjustedColWidths[0];

      // Registrations
      ctx.font = tableNumberFont;
      ctx.fillStyle = '#52c41a';
      const col1CenterX = x + adjustedColWidths[1] / 2;
      ctx.fillText(formatInteger(team.total.registrations), col1CenterX, y + 22);
      x += adjustedColWidths[1];

      // Friends
      ctx.fillStyle = '#1890ff';
      const col2CenterX = x + adjustedColWidths[2] / 2;
      ctx.fillText(formatInteger(team.total.friends), col2CenterX, y + 22);
      x += adjustedColWidths[2];

      // Groups
      ctx.fillStyle = '#ff4d4f';
      const col3CenterX = x + adjustedColWidths[3] / 2;
      ctx.fillText(formatInteger(team.total.groups), col3CenterX, y + 22);
      x += adjustedColWidths[3];

      // Messages
      ctx.fillStyle = '#722ed1';
      const col4CenterX = x + adjustedColWidths[4] / 2;
      ctx.fillText(formatInteger(team.total.messages || 0), col4CenterX, y + 22);

      y += rowHeight;
    });

    // Total row
    ctx.fillStyle = '#3A3A3C';
    ctx.fillRect(tableX, y, tableWidth, rowHeight);
    ctx.strokeRect(tableX, y, tableWidth, rowHeight);

    x = tableX;
    ctx.textAlign = 'center';
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 14px "Segoe UI"';
    const totalCol0CenterX = x + adjustedColWidths[0] / 2;
    ctx.fillText('รวม', totalCol0CenterX, y + 22);
    x += adjustedColWidths[0];

    ctx.font = tableNumberFont;
    ctx.fillStyle = '#52c41a';
    const totalCol1CenterX = x + adjustedColWidths[1] / 2;
    ctx.fillText(formatInteger(data.totals.registrations), totalCol1CenterX, y + 22);
    x += adjustedColWidths[1];

    ctx.fillStyle = '#1890ff';
    const totalCol2CenterX = x + adjustedColWidths[2] / 2;
    ctx.fillText(formatInteger(data.totals.friends), totalCol2CenterX, y + 22);
    x += adjustedColWidths[2];

    ctx.fillStyle = '#ff4d4f';
    const totalCol3CenterX = x + adjustedColWidths[3] / 2;
    ctx.fillText(formatInteger(data.totals.groups), totalCol3CenterX, y + 22);
    x += adjustedColWidths[3];

    ctx.fillStyle = '#722ed1';
    const totalCol4CenterX = x + adjustedColWidths[4] / 2;
    ctx.fillText(formatInteger(data.totals.messages || 0), totalCol4CenterX, y + 22);

    // Download image
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TeamStats_${startDateStr}_${endDateStr}_${dayjs().format('HHmmss')}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const generateTeamUserStatsImageRange = async (teamData, startDateStr, endDateStr) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const width = 1800;
    const rowHeight = 30;
    const headerRowHeight = 40;
    const dateHeaderHeight = 40;
    const margin = 20;
    const baseHeight = dateHeaderHeight + headerRowHeight + rowHeight + margin * 2;
    const userRows = teamData.users ? teamData.users.length : 0;
    const height = baseHeight + (userRows * rowHeight) + rowHeight; // + rowHeight for total row
    canvas.width = width;
    canvas.height = height;

    // Helper function to format numbers with decimals
    const formatNumber = (num) => {
      if (num === null || num === undefined || isNaN(num)) return '0.00';
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Helper function to format integers with comma
    const formatInteger = (num) => {
      if (num === null || num === undefined || isNaN(num)) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Colors (matching LineDaily style)
    const bgColor = '#1C1C1E';
    const cardBg = '#2C2C2E';
    const borderColor = '#48484A';
    const textPrimary = '#FFFFFF';
    const linePrimary = '#00C300';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Fonts
    const headerFont = 'bold 20px "Segoe UI"';
    const tableHeaderFont = 'bold 14px "Segoe UI"';
    const tableDataFont = '13px "Segoe UI"';
    const tableNumberFont = 'bold 13px "Segoe UI"';

    let y = 10;

    // Date header - show date range and team name
    ctx.fillStyle = linePrimary;
    ctx.font = headerFont;
    ctx.textAlign = 'center';
    const startDate = dayjs(startDateStr).format('DD/MM/YYYY');
    const endDate = dayjs(endDateStr).format('DD/MM/YYYY');
    const dateText = `วันที่ ${startDate} - วันที่ ${endDate} (ทีม${teamData.teamName})`;
    ctx.fillText(dateText, width / 2, y + 20);
    y += dateHeaderHeight;

    // Table setup - 6 columns
    const tableX = 0;
    const tableWidth = width;
    const colWidths = [80, 200, 120, 120, 120, 120];
    const totalColWidth = colWidths.reduce((a, b) => a + b, 0);

    // Adjust column widths to fit table width
    const scale = (tableWidth - 20) / totalColWidth;
    const adjustedColWidths = colWidths.map(w => Math.floor(w * scale));

    // Table header row
    ctx.fillStyle = cardBg;
    ctx.fillRect(tableX, y, tableWidth, headerRowHeight);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, y, tableWidth, headerRowHeight);

    let x = tableX;
    ctx.fillStyle = textPrimary;
    ctx.font = tableHeaderFont;
    ctx.textAlign = 'center';
    
    const headers = [
      'ลำดับ',
      'User', 
      'เพิ่มบัญชี', 
      'เพิ่มเพื่อน', 
      'สร้างกลุ่ม', 
      'ส่งข้อความ'
    ];
    
    headers.forEach((header, i) => {
      const colCenterX = x + adjustedColWidths[i] / 2;
      ctx.fillText(header, colCenterX, y + 25);
      x += adjustedColWidths[i];
    });

    y += headerRowHeight;

    // Calculate totals
    const totals = teamData.users.reduce((acc, user) => ({
      registrations: acc.registrations + user.registrations,
      friends: acc.friends + user.friends,
      groups: acc.groups + user.groups,
      messages: acc.messages + user.messages
    }), {
      registrations: 0,
      friends: 0,
      groups: 0,
      messages: 0
    });

    // Data rows
    teamData.users.forEach((user, index) => {
      const isEven = index % 2 === 0;
      ctx.fillStyle = isEven ? cardBg : '#262628';
      ctx.fillRect(tableX, y, tableWidth, rowHeight);
      ctx.strokeRect(tableX, y, tableWidth, rowHeight);

      x = tableX;
      ctx.textAlign = 'center';
      ctx.fillStyle = textPrimary;
      ctx.font = tableDataFont;

      // Index
      const col0CenterX = x + adjustedColWidths[0] / 2;
      ctx.fillText((index + 1).toString(), col0CenterX, y + 22);
      x += adjustedColWidths[0];

      // User name
      const col1CenterX = x + adjustedColWidths[1] / 2;
      ctx.fillText(user.userName, col1CenterX, y + 22);
      x += adjustedColWidths[1];

      // Registrations
      ctx.font = tableNumberFont;
      ctx.fillStyle = '#52c41a';
      const col2CenterX = x + adjustedColWidths[2] / 2;
      ctx.fillText(formatInteger(user.registrations), col2CenterX, y + 22);
      x += adjustedColWidths[2];

      // Friends
      ctx.fillStyle = '#1890ff';
      const col3CenterX = x + adjustedColWidths[3] / 2;
      ctx.fillText(formatInteger(user.friends), col3CenterX, y + 22);
      x += adjustedColWidths[3];

      // Groups
      ctx.fillStyle = '#ff4d4f';
      const col4CenterX = x + adjustedColWidths[4] / 2;
      ctx.fillText(formatInteger(user.groups), col4CenterX, y + 22);
      x += adjustedColWidths[4];

      // Messages
      ctx.fillStyle = '#722ed1';
      const col5CenterX = x + adjustedColWidths[5] / 2;
      ctx.fillText(formatInteger(user.messages || 0), col5CenterX, y + 22);

      y += rowHeight;
    });

    // Total row
    ctx.fillStyle = '#3A3A3C';
    ctx.fillRect(tableX, y, tableWidth, rowHeight);
    ctx.strokeRect(tableX, y, tableWidth, rowHeight);

    x = tableX;
    ctx.textAlign = 'center';
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 14px "Segoe UI"';
    const totalCol0CenterX = x + adjustedColWidths[0] / 2;
    ctx.fillText('', totalCol0CenterX, y + 22);
    x += adjustedColWidths[0];

    const totalCol1CenterX = x + adjustedColWidths[1] / 2;
    ctx.fillText('รวม', totalCol1CenterX, y + 22);
    x += adjustedColWidths[1];

    ctx.font = tableNumberFont;
    ctx.fillStyle = '#52c41a';
    const totalCol2CenterX = x + adjustedColWidths[2] / 2;
    ctx.fillText(formatInteger(totals.registrations), totalCol2CenterX, y + 22);
    x += adjustedColWidths[2];

    ctx.fillStyle = '#1890ff';
    const totalCol3CenterX = x + adjustedColWidths[3] / 2;
    ctx.fillText(formatInteger(totals.friends), totalCol3CenterX, y + 22);
    x += adjustedColWidths[3];

    ctx.fillStyle = '#ff4d4f';
    const totalCol4CenterX = x + adjustedColWidths[4] / 2;
    ctx.fillText(formatInteger(totals.groups), totalCol4CenterX, y + 22);
    x += adjustedColWidths[4];

    ctx.fillStyle = '#722ed1';
    const totalCol5CenterX = x + adjustedColWidths[5] / 2;
    ctx.fillText(formatInteger(totals.messages || 0), totalCol5CenterX, y + 22);

    // Download image
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Sanitize team name for filename
      const sanitizedTeamName = teamData.teamName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `TeamUserStats_${startDateStr}_${endDateStr}_${sanitizedTeamName}_${dayjs().format('HHmmss')}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const generateTeamStatsImage = async (data, dateStr) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const width = 1800;
    const rowHeight = 30;
    const headerRowHeight = 45;
    const dateHeaderHeight = 40;
    const margin = 20;
    const padding = 10;
    const baseHeight = dateHeaderHeight + headerRowHeight + rowHeight + margin * 2;
    const teamRows = data.teams ? data.teams.length : 0;
    const height = baseHeight + (teamRows * rowHeight) + rowHeight; // + rowHeight for total row
    canvas.width = width;
    canvas.height = height;

    // Helper function to format numbers
    const formatNumber = (num) => {
      if (num === null || num === undefined || isNaN(num)) return '0.00';
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Colors (matching LineDaily style)
    const bgColor = '#1C1C1E';
    const cardBg = '#2C2C2E';
    const borderColor = '#48484A';
    const textPrimary = '#FFFFFF';
    const textSecondary = '#AEAEB2';
    const linePrimary = '#00C300';
    const redColor = '#ff4d4f';
    const greenColor = '#00C300';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Fonts
    const headerFont = 'bold 20px "Segoe UI"';
    const titleFont = 'bold 18px "Segoe UI"';
    const tableHeaderFont = 'bold 14px "Segoe UI"';
    const tableDataFont = '13px "Segoe UI"';
    const tableNumberFont = 'bold 13px "Segoe UI"';

    let y = 10;

    // Date header
    ctx.fillStyle = linePrimary;
    ctx.font = headerFont;
    ctx.textAlign = 'center';
    const dateText = `วันที่ ${dayjs(dateStr).format('DD/MM/YYYY')}`;
    ctx.fillText(dateText, width / 2, y + 20);
    y += dateHeaderHeight;

    // Table setup - 5 columns (no deposit)
    const tableX = 0;
    const tableWidth = width;
    const colWidths = [150, 100, 100, 100, 100];
    const totalColWidth = colWidths.reduce((a, b) => a + b, 0);

    // Adjust column widths to fit table width
    const scale = (tableWidth - 20) / totalColWidth;
    const adjustedColWidths = colWidths.map(w => Math.floor(w * scale));

    // Table header row
    ctx.fillStyle = cardBg;
    ctx.fillRect(tableX, y, tableWidth, headerRowHeight);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, y, tableWidth, headerRowHeight);

    let x = tableX;
    ctx.fillStyle = textPrimary;
    ctx.font = tableHeaderFont;
    ctx.textAlign = 'center';
    
    const headers = [
      'ชื่อทีม', 
      'เพิ่มบัญชี', 
      'เพิ่มเพื่อน', 
      'สร้างกลุ่ม', 
      'ส่งข้อความ'
    ];
    
    headers.forEach((header, i) => {
      const colCenterX = x + adjustedColWidths[i] / 2;
      ctx.fillText(header, colCenterX, y + 22);
      x += adjustedColWidths[i];
    });

    y += headerRowHeight;

    // Data rows
    data.teams.forEach((team, index) => {
      const isEven = index % 2 === 0;
      ctx.fillStyle = isEven ? cardBg : '#262628';
      ctx.fillRect(tableX, y, tableWidth, rowHeight);
      ctx.strokeRect(tableX, y, tableWidth, rowHeight);

      x = tableX;
      ctx.textAlign = 'center';
      ctx.fillStyle = textPrimary;
      ctx.font = tableDataFont;

      // Team name
      const col0CenterX = x + adjustedColWidths[0] / 2;
      ctx.fillText(team.teamName, col0CenterX, y + 22);
      x += adjustedColWidths[0];

      // Registrations
      ctx.font = tableNumberFont;
      ctx.fillStyle = '#52c41a';
      const col1CenterX = x + adjustedColWidths[1] / 2;
      ctx.fillText(team.today.registrations.toString(), col1CenterX, y + 22);
      x += adjustedColWidths[1];

      // Friends
      ctx.fillStyle = '#1890ff';
      const col2CenterX = x + adjustedColWidths[2] / 2;
      ctx.fillText(team.today.friends.toString(), col2CenterX, y + 22);
      x += adjustedColWidths[2];

      // Groups
      ctx.fillStyle = '#ff4d4f';
      const col3CenterX = x + adjustedColWidths[3] / 2;
      ctx.fillText(team.today.groups.toString(), col3CenterX, y + 22);
      x += adjustedColWidths[3];

      // Messages
      ctx.fillStyle = '#722ed1';
      const col4CenterX = x + adjustedColWidths[4] / 2;
      ctx.fillText((team.today.messages || 0).toString(), col4CenterX, y + 22);

      y += rowHeight;
    });

    // Total row
    ctx.fillStyle = '#3A3A3C';
    ctx.fillRect(tableX, y, tableWidth, rowHeight);
    ctx.strokeRect(tableX, y, tableWidth, rowHeight);

    x = tableX;
    ctx.textAlign = 'center';
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 14px "Segoe UI"';
    const totalCol0CenterX = x + adjustedColWidths[0] / 2;
    ctx.fillText('รวม', totalCol0CenterX, y + 22);
    x += adjustedColWidths[0];

    ctx.font = tableNumberFont;
    ctx.fillStyle = '#52c41a';
    const totalCol1CenterX = x + adjustedColWidths[1] / 2;
    ctx.fillText(data.totals.registrations.toString(), totalCol1CenterX, y + 22);
    x += adjustedColWidths[1];

    ctx.fillStyle = '#1890ff';
    const totalCol2CenterX = x + adjustedColWidths[2] / 2;
    ctx.fillText(data.totals.friends.toString(), totalCol2CenterX, y + 22);
    x += adjustedColWidths[2];

    ctx.fillStyle = '#ff4d4f';
    const totalCol3CenterX = x + adjustedColWidths[3] / 2;
    ctx.fillText(data.totals.groups.toString(), totalCol3CenterX, y + 22);
    x += adjustedColWidths[3];

    ctx.fillStyle = '#722ed1';
    const totalCol4CenterX = x + adjustedColWidths[4] / 2;
    ctx.fillText((data.totals.messages || 0).toString(), totalCol4CenterX, y + 22);

    // Download image
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TeamStats_${dateStr}_${dayjs().format('HHmmss')}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const columns = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: isMobile ? 60 : 80,
      align: 'center',
      render: (_, __, index) => (
        <div style={{ textAlign: 'center' }}>{index + 1}</div>
      ),
    },
    {
      title: 'User',
      dataIndex: ['user', 'user'],
      key: 'user',
      width: isMobile ? 100 : 150,
      align: 'center',
      render: (text) => (
        <div style={{ textAlign: 'center' }}>
          <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{text || '-'}</Text>
        </div>
      ),
    },
    {
      title: 'ทีม',
      dataIndex: ['user', 'team', 'name'],
      key: 'team',
      width: isMobile ? 120 : 180,
      align: 'center',
      render: (teamName) => (
        <div style={{ textAlign: 'center' }}>
          {teamName ? (
            <Tag 
              color="green"
              style={{ fontSize: isMobile ? '10px' : '12px' }}
            >
              {teamName}
            </Tag>
          ) : (
            <Text style={{ fontSize: isMobile ? '11px' : '12px', color: '#888888' }}>
              ไม่มีทีม
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      width: isMobile ? 120 : 180,
      align: 'center',
      render: (date, record) => {
        const isDateRange = dateRange && dateRange[0] && dateRange[1] && 
                            !dateRange[0].isSame(dateRange[1], 'day');
        
        if (isDateRange) {
          return (
            <div style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: isMobile ? '11px' : '12px' }}>
                {dateRange[0].format('DD/MM/YYYY')} - {dateRange[1].format('DD/MM/YYYY')}
              </Text>
            </div>
          );
        }
        
        return (
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: isMobile ? '11px' : '12px' }}>
              {date ? dayjs(date).format('DD/MM/YYYY') : '-'}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'เพิ่มบัญชี',
      dataIndex: 'registrationsCount',
      key: 'registrationsCount',
      width: isMobile ? 90 : 120,
      align: 'center',
      render: (count) => (
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', color: count > 0 ? 'var(--lambo-gold)' : '#888' }}>
            {count || 0}
          </Text>
        </div>
      ),
    },
    {
      title: 'เพิ่มเพื่อน',
      dataIndex: 'friendsAddedCount',
      key: 'friendsAddedCount',
      width: isMobile ? 90 : 120,
      align: 'center',
      render: (count) => (
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', color: count > 0 ? 'var(--lambo-cyan)' : '#888' }}>
            {count || 0}
          </Text>
        </div>
      ),
    },
    {
      title: 'สร้างกลุ่ม',
      dataIndex: 'groupsCreatedCount',
      key: 'groupsCreatedCount',
      width: isMobile ? 90 : 120,
      align: 'center',
      render: (count) => (
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', color: count > 0 ? 'var(--lambo-white)' : '#888' }}>
            {count || 0}
          </Text>
        </div>
      ),
    },
    {
      title: 'ส่งข้อความ',
      dataIndex: 'messagesSentCount',
      key: 'messagesSentCount',
      width: isMobile ? 90 : 120,
      align: 'center',
      render: (count) => (
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', color: count > 0 ? 'var(--lambo-gold-light)' : '#888' }}>
            {count || 0}
          </Text>
        </div>
      ),
    },
    {
      title: 'อัพเดตล่าสุด',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: isMobile ? 130 : 180,
      align: 'center',
      render: (date) => (
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: isMobile ? '11px' : '12px' }}>
            {date ? dayjs(date).format(isMobile ? 'DD/MM/YY HH:mm' : 'DD/MM/YYYY HH:mm') : '-'}
          </Text>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--lambo-black)' }}>
      <AppHeader title="Update Data" />

      <Content style={{ padding: '16px', background: 'var(--lambo-black)' }}>
        <div className="responsive-container">
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={12} md={6}>
              <div className="lambo-stat-panel">
                <Text style={{ color: 'var(--lambo-ash)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>เพิ่มบัญชีทั้งหมด</Text>
                <div style={{ color: 'var(--lambo-gold)', fontSize: isMobile ? '20px' : '28px', fontWeight: 600, marginTop: 6 }}>
                  {summary.totalRegistrations} <span style={{ fontSize: 13, color: 'var(--lambo-ash)' }}>บัญชี</span>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <div className="lambo-stat-panel">
                <Text style={{ color: 'var(--lambo-ash)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>เพิ่มเพื่อนทั้งหมด</Text>
                <div style={{ color: 'var(--lambo-cyan)', fontSize: isMobile ? '20px' : '28px', fontWeight: 600, marginTop: 6 }}>
                  {summary.totalFriends} <span style={{ fontSize: 13, color: 'var(--lambo-ash)' }}>คน</span>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <div className="lambo-stat-panel">
                <Text style={{ color: 'var(--lambo-ash)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>สร้างกลุ่มทั้งหมด</Text>
                <div style={{ color: 'var(--lambo-white)', fontSize: isMobile ? '20px' : '28px', fontWeight: 600, marginTop: 6 }}>
                  {summary.totalGroups} <span style={{ fontSize: 13, color: 'var(--lambo-ash)' }}>กลุ่ม</span>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <div className="lambo-stat-panel">
                <Text style={{ color: 'var(--lambo-ash)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>ส่งข้อความทั้งหมด</Text>
                <div style={{ color: 'var(--lambo-gold-light)', fontSize: isMobile ? '20px' : '28px', fontWeight: 600, marginTop: 6 }}>
                  {summary.totalMessages} <span style={{ fontSize: 13, color: 'var(--lambo-ash)' }}>ครั้ง</span>
                </div>
              </div>
            </Col>
          </Row>

          <Card
            className="lambo-panel"
            style={{
              background: 'var(--lambo-iron)',
              border: '1px solid var(--lambo-border)',
              marginBottom: 16
            }}
          >
            <Space
              direction={isMobile ? 'vertical' : 'horizontal'}
              style={{ width: '100%', justifyContent: 'space-between' }}
              wrap
            >
              <Space wrap>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  allowClear={false}
                  style={{ width: isMobile ? '100%' : 300 }}
                  placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
                />
                <Select
                  value={selectedTeam}
                  onChange={handleTeamChange}
                  style={{ width: isMobile ? '100%' : 200 }}
                  placeholder="เลือกทีม"
                >
                  <Select.Option value="all">ทุกทีม</Select.Option>
                  <Select.Option value="no-team">ไม่มีทีม</Select.Option>
                  {teams.map(team => (
                    <Select.Option key={team._id} value={team._id}>
                      {team.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                >
                  รีเฟรช
                </Button>
              </Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleGenerateImage}
                disabled={stats.length === 0}
                loading={loading}
              >
                สร้างรูป
              </Button>
            </Space>
          </Card>

          <Card
            className="lambo-panel"
            style={{
              background: 'var(--lambo-iron)',
              border: '1px solid var(--lambo-border)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <Table
                columns={columns}
                dataSource={stats}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: !isMobile,
                  showQuickJumper: !isMobile,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} จาก ${total} รายการ`,
                  size: isMobile ? 'small' : 'default'
                }}
                style={{
                  background: 'var(--lambo-black)',
                  minWidth: isMobile ? '700px' : '800px'
                }}
                size={isMobile ? 'small' : 'default'}
                scroll={{ x: isMobile ? 700 : undefined }}
              />
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default UpdateData;
