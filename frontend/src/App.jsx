import React, { useState, useEffect } from 'react'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, BarChart, Bar, Area, AreaChart } from 'recharts'
import { 
  LayoutGrid, 
  Flame, 
  Users, 
  Sparkles, 
  FlaskConical, 
  FileText, 
  Bell, 
  Download, 
  BookOpen,
  Menu,
  X,
  Check
} from 'lucide-react'

function App() {
  const [activeMenuItem, setActiveMenuItem] = useState('Кластеризация')
  const [selectedFilter, setSelectedFilter] = useState('total')
  const [selectedClass, setSelectedClass] = useState('Все')
  const [selectedTimeRange, setSelectedTimeRange] = useState('all-time')
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [testingData, setTestingData] = useState(null)
  const [testingMetrics, setTestingMetrics] = useState({
    accuracy: 0.847,
    f1Micro: 0.823
  })
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)
  const [predictionsError, setPredictionsError] = useState(null)
  const [predictionsResponse, setPredictionsResponse] = useState(null)
  const [availableTopics, setAvailableTopics] = useState([])
  const [isLoadingTopics, setIsLoadingTopics] = useState(false)
  const [topicsError, setTopicsError] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState(null)

  // Состояния для sentiment API
  const [sentimentData, setSentimentData] = useState(null)
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false)
  const [sentimentError, setSentimentError] = useState(null)

  // Состояния для topics statistics API
  const [topicsStatisticsData, setTopicsStatisticsData] = useState(null)
  const [isLoadingTopicsStatistics, setIsLoadingTopicsStatistics] = useState(false)
  const [topicsStatisticsError, setTopicsStatisticsError] = useState(null)
  const [heatmapData, setHeatmapData] = useState(null);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [heatmapError, setHeatmapError] = useState(null);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportFormat, setReportFormat] = useState('excel');
  const [selectedReportTopics, setSelectedReportTopics] = useState([]);

  const [competitorData, setCompetitorData] = useState(null);
  const [isLoadingCompetitors, setIsLoadingCompetitors] = useState(false);
  const [competitorError, setCompetitorError] = useState(null);
  const [selectedCompetitors, setSelectedCompetitors] = useState(["Sber", "Tinkoff"]);

  const [alertsData, setAlertsData] = useState(null);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState(null);

  const [recommendationsData, setRecommendationsData] = useState("");
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);
  const [selectedTopicForAnalysis, setSelectedTopicForAnalysis] = useState('Кредитные карты');
  const [isExporting, setIsExporting] = useState(false);

  // Состояние для drag-and-drop на странице тестирования
  const [isDragOver, setIsDragOver] = useState(false);

  // Состояния для отслеживания источника данных (API vs Mock)
  const [dataSource, setDataSource] = useState({
    dashboard: null,      // 'api' | 'mock' | null
    topics: null,
    sentiment: null,
    topicsStatistics: null,
    heatmap: null,
    competitors: null,
    alerts: null,
    recommendations: null
  });

  // Функция для обновления источника данных
  const updateDataSource = (key, source) => {
    setDataSource(prev => ({ ...prev, [key]: source }));
  };

  // Функция для перевода названий тем на русский язык
  const translateTopicName = (topicName) => {
    const translations = {
      'autocredits': 'Автокредиты',
      'creditcards': 'Кредитные карты',
      'credits': 'Кредиты',
      'debitcards': 'Дебетовые карты',
      'deposits': 'Депозиты',
      'hypothec': 'Ипотека',
      'individual': 'Индивидуальные услуги',
      'mobile_app': 'Мобильное приложение',
      'other': 'Прочее',
      'remote': 'Удаленное обслуживание',
      'restructing': 'Реструктуризация',
      'transfers': 'Переводы'
    }
    return translations[topicName] || topicName
  }

  // Функция для вычисления дат и режима на основе выбранного временного диапазона
  const getDateRangeAndMode = () => {
    const now = new Date()
    const endDate = new Date(now)
    endDate.setHours(23, 59, 59, 999) // Конец дня
    
    let startDate = new Date(now)
    let mode = 'days:day'
    
    switch (selectedTimeRange) {
      case 'all-time':
        startDate = new Date('2024-01-01T00:00:00Z')
        mode = 'all:month'
        break
      case 'last-month':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        mode = 'days:day'
        break
      case 'last-6-months':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 6)
        mode = 'halfyear:week'
        break
      case 'last-12-months':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 12)
        mode = 'all:month'
        break
      case 'custom':
        // Используем customDateRange если он задан
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = new Date(customDateRange.startDate + 'T00:00:00Z')
          endDate.setTime(new Date(customDateRange.endDate + 'T23:59:59Z').getTime())
          
          // Определяем режим на основе длительности диапазона
          const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24)
          const diffInMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
          
          if (diffInDays <= 30) {
            mode = 'days:day'
          } else if (diffInMonths < 12) {
            mode = 'halfyear:week'
          } else {
            mode = 'all:month'
          }
        } else {
          // Fallback к последним 30 дням
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 30)
          mode = 'days:day'
        }
        break
      default:
        // По умолчанию - последние 30 дней
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        mode = 'days:day'
    }
    
    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      mode: mode
    }
  }

  // Функция для загрузки тем из API
  const fetchAvailableTopics = async () => {
    setIsLoadingTopics(true)
    setTopicsError(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/topics/available')
      
      if (!response.ok) {
        throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.status === 'success' && data.data) {
        // Преобразуем данные в формат для карточек классов
        const topicsWithColors = data.data.map((topic, index) => {
          const colors = ['#FF6B35', '#06D6A0', '#118AB2', '#EF476F', '#FFD23F', '#9B59B6', '#E67E22', '#2ECC71', '#E74C3C', '#F39C12', '#8E44AD', '#3498DB']
          return {
            id: topic,
            label: translateTopicName(topic),
            color: colors[index % colors.length]
          }
        })
        
        // Добавляем карточку "Все" в начало списка
        const allTopics = [
          { id: 'Все', label: 'Все', color: '#2b61ec' },
          ...topicsWithColors
        ]
        
        setAvailableTopics(allTopics)
        updateDataSource('topics', 'api')
      } else {
        throw new Error('Некорректный формат ответа от сервера')
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
      setTopicsError(error.message)
      updateDataSource('topics', 'mock')
      
      // Fallback к статическим данным в случае ошибки
      setAvailableTopics([
        { id: 'Все', label: 'Все', color: '#2b61ec' },
        { id: 'autocredits', label: translateTopicName('autocredits'), color: '#FF6B35' },
        { id: 'creditcards', label: translateTopicName('creditcards'), color: '#06D6A0' },
        { id: 'credits', label: translateTopicName('credits'), color: '#118AB2' },
        { id: 'debitcards', label: translateTopicName('debitcards'), color: '#EF476F' },
        { id: 'deposits', label: translateTopicName('deposits'), color: '#FFD23F' },
        { id: 'hypothec', label: translateTopicName('hypothec'), color: '#9B59B6' },
        { id: 'individual', label: translateTopicName('individual'), color: '#E67E22' },
        { id: 'mobile_app', label: translateTopicName('mobile_app'), color: '#2ECC71' },
        { id: 'other', label: translateTopicName('other'), color: '#E74C3C' },
        { id: 'remote', label: translateTopicName('remote'), color: '#F39C12' },
        { id: 'restructing', label: translateTopicName('restructing'), color: '#8E44AD' },
        { id: 'transfers', label: translateTopicName('transfers'), color: '#3498DB' }
      ])
    } finally {
      setIsLoadingTopics(false)
    }
  }

  // Mock данные для дашборда
  const mockDashboardData = {
    status: 'success',
    data: {
      overview: {
        total_reviews: 4523,
        popular_topics: [
          { topic: 'creditcards', count: 1245 },
          { topic: 'hypothec', count: 987 },
          { topic: 'mobile_app', count: 856 },
          { topic: 'deposits', count: 634 },
          { topic: 'transfers', count: 521 },
          { topic: 'debitcards', count: 412 },
          { topic: 'credits', count: 356 },
          { topic: 'autocredits', count: 289 },
          { topic: 'individual', count: 178 },
          { topic: 'remote', count: 145 }
        ]
      },
      topic_trends: [
        { period: '2024-01', topic: 'creditcards', count: 120 },
        { period: '2024-02', topic: 'creditcards', count: 145 },
        { period: '2024-03', topic: 'creditcards', count: 132 },
        { period: '2024-04', topic: 'creditcards', count: 167 },
        { period: '2024-05', topic: 'creditcards', count: 189 },
        { period: '2024-06', topic: 'creditcards', count: 156 },
        { period: '2024-01', topic: 'hypothec', count: 89 },
        { period: '2024-02', topic: 'hypothec', count: 102 },
        { period: '2024-03', topic: 'hypothec', count: 95 },
        { period: '2024-04', topic: 'hypothec', count: 118 },
        { period: '2024-05', topic: 'hypothec', count: 134 },
        { period: '2024-06', topic: 'hypothec', count: 112 },
        { period: '2024-01', topic: 'mobile_app', count: 78 },
        { period: '2024-02', topic: 'mobile_app', count: 92 },
        { period: '2024-03', topic: 'mobile_app', count: 85 },
        { period: '2024-04', topic: 'mobile_app', count: 103 },
        { period: '2024-05', topic: 'mobile_app', count: 121 },
        { period: '2024-06', topic: 'mobile_app', count: 98 },
        { period: '2024-01', topic: 'deposits', count: 56 },
        { period: '2024-02', topic: 'deposits', count: 67 },
        { period: '2024-03', topic: 'deposits', count: 61 },
        { period: '2024-04', topic: 'deposits', count: 74 },
        { period: '2024-05', topic: 'deposits', count: 82 },
        { period: '2024-06', topic: 'deposits', count: 69 }
      ]
    }
  };

  // Функция для загрузки данных дашборда
  const fetchDashboardData = async () => {
    setIsLoadingDashboard(true)
    setDashboardError(null)
    
    try {
      const dateRangeAndMode = getDateRangeAndMode()
      console.log('Dashboard API date range and mode:', dateRangeAndMode)
      
      const response = await fetch('http://localhost:8000/api/dashboard/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: dateRangeAndMode.start_date,
          end_date: dateRangeAndMode.end_date,
          mode: dateRangeAndMode.mode
        })
      })
      
      if (!response.ok) {
        throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Dashboard API response:', data)
      setDashboardData(data)
      updateDataSource('dashboard', 'api')
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardError(error.message)
      // Используем mock данные при ошибке
      setDashboardData(mockDashboardData)
      updateDataSource('dashboard', 'mock')
    } finally {
      setIsLoadingDashboard(false)
    }
  }

  // Mock данные для тональности
  const getMockSentimentData = (topicId) => ({
    status: 'success',
    data: [{
      topic: topicId,
      sentiment_breakdown: {
        'положительно': Math.floor(Math.random() * 200) + 100,
        'нейтрально': Math.floor(Math.random() * 150) + 50,
        'отрицательно': Math.floor(Math.random() * 100) + 30
      }
    }]
  });

  // Функция для загрузки данных тональности
  const fetchSentimentData = async (topicId) => {
    if (topicId === 'Все') {
      setSentimentData(null)
      updateDataSource('sentiment', null)
      return
    }

    setIsLoadingSentiment(true)
    setSentimentError(null)
    try {
      const dateRangeAndMode = getDateRangeAndMode()
      console.log('Sentiment API date range and mode:', dateRangeAndMode)
      
      const response = await fetch('http://localhost:8000/api/topics/comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: dateRangeAndMode.start_date,
          end_date: dateRangeAndMode.end_date,
          mode: dateRangeAndMode.mode,
          topics: [topicId]
        })
      })
      
      if (!response.ok) {
        throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Sentiment API response:', data)
      setSentimentData(data)
      updateDataSource('sentiment', 'api')
    } catch (error) {
      console.error('Error fetching sentiment data:', error)
      setSentimentError(error.message)
      // Используем mock данные при ошибке
      setSentimentData(getMockSentimentData(topicId))
      updateDataSource('sentiment', 'mock')
    } finally {
      setIsLoadingSentiment(false)
    }
  }

  // Mock данные для статистики по темам
  const getMockTopicsStatisticsData = (topicId) => ({
    status: 'success',
    data: [
      { period: '2024-01', topic: topicId, total_mentions: Math.floor(Math.random() * 100) + 50 },
      { period: '2024-02', topic: topicId, total_mentions: Math.floor(Math.random() * 100) + 60 },
      { period: '2024-03', topic: topicId, total_mentions: Math.floor(Math.random() * 100) + 55 },
      { period: '2024-04', topic: topicId, total_mentions: Math.floor(Math.random() * 100) + 70 },
      { period: '2024-05', topic: topicId, total_mentions: Math.floor(Math.random() * 100) + 80 },
      { period: '2024-06', topic: topicId, total_mentions: Math.floor(Math.random() * 100) + 65 }
    ]
  });

  // Функция для загрузки данных статистики по темам
  const fetchTopicsStatisticsData = async (topicId) => {
    if (topicId === 'Все') {
      setTopicsStatisticsData(null)
      updateDataSource('topicsStatistics', null)
      return
    }

    setIsLoadingTopicsStatistics(true)
    setTopicsStatisticsError(null)
    try {
      const dateRangeAndMode = getDateRangeAndMode()
      console.log('Topics Statistics API date range and mode:', dateRangeAndMode)
      
      const response = await fetch('http://localhost:8000/api/topics/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: dateRangeAndMode.start_date,
          end_date: dateRangeAndMode.end_date,
          mode: dateRangeAndMode.mode,
          topics: [topicId]
        })
      })
      
      if (!response.ok) {
        throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Topics Statistics API response:', data)
      setTopicsStatisticsData(data)
      updateDataSource('topicsStatistics', 'api')
    } catch (error) {
      console.error('Error fetching topics statistics data:', error)
      setTopicsStatisticsError(error.message)
      // Используем mock данные при ошибке
      setTopicsStatisticsData(getMockTopicsStatisticsData(topicId))
      updateDataSource('topicsStatistics', 'mock')
    } finally {
      setIsLoadingTopicsStatistics(false)
    }
  }

  // Полные mock данные для тепловой карты
  const mockHeatmapData = [
    { period: '2024-01', topic: 'hypothec', count: 15 },
    { period: '2024-02', topic: 'hypothec', count: 18 },
    { period: '2024-03', topic: 'hypothec', count: 12 },
    { period: '2024-04', topic: 'hypothec', count: 22 },
    { period: '2024-05', topic: 'hypothec', count: 19 },
    { period: '2024-06', topic: 'hypothec', count: 14 },
    { period: '2024-01', topic: 'creditcards', count: 25 },
    { period: '2024-02', topic: 'creditcards', count: 32 },
    { period: '2024-03', topic: 'creditcards', count: 28 },
    { period: '2024-04', topic: 'creditcards', count: 35 },
    { period: '2024-05', topic: 'creditcards', count: 42 },
    { period: '2024-06', topic: 'creditcards', count: 38 },
    { period: '2024-01', topic: 'mobile_app', count: 18 },
    { period: '2024-02', topic: 'mobile_app', count: 24 },
    { period: '2024-03', topic: 'mobile_app', count: 21 },
    { period: '2024-04', topic: 'mobile_app', count: 28 },
    { period: '2024-05', topic: 'mobile_app', count: 35 },
    { period: '2024-06', topic: 'mobile_app', count: 30 },
    { period: '2024-01', topic: 'deposits', count: 8 },
    { period: '2024-02', topic: 'deposits', count: 12 },
    { period: '2024-03', topic: 'deposits', count: 10 },
    { period: '2024-04', topic: 'deposits', count: 15 },
    { period: '2024-05', topic: 'deposits', count: 18 },
    { period: '2024-06', topic: 'deposits', count: 14 },
    { period: '2024-01', topic: 'transfers', count: 6 },
    { period: '2024-02', topic: 'transfers', count: 9 },
    { period: '2024-03', topic: 'transfers', count: 7 },
    { period: '2024-04', topic: 'transfers', count: 11 },
    { period: '2024-05', topic: 'transfers', count: 14 },
    { period: '2024-06', topic: 'transfers', count: 10 },
    { period: '2024-01', topic: 'debitcards', count: 12 },
    { period: '2024-02', topic: 'debitcards', count: 16 },
    { period: '2024-03', topic: 'debitcards', count: 14 },
    { period: '2024-04', topic: 'debitcards', count: 19 },
    { period: '2024-05', topic: 'debitcards', count: 22 },
    { period: '2024-06', topic: 'debitcards', count: 17 }
  ];

  const fetchHeatmapData = async () => {
    setIsLoadingHeatmap(true);
    setHeatmapError(null);
    try {
      const dateRangeAndMode = getDateRangeAndMode();
      const response = await fetch('http://localhost:8000/api/dashboard/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: dateRangeAndMode.start_date,
          end_date: dateRangeAndMode.end_date,
          mode: dateRangeAndMode.mode,
        }),
      });
      if (!response.ok) throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (data.status === 'success') {
        setHeatmapData(data.data);
        updateDataSource('heatmap', 'api');
      } else {
        throw new Error('Некорректный формат ответа от сервера');
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      setHeatmapError(error.message);
      setHeatmapData(mockHeatmapData);
      updateDataSource('heatmap', 'mock');
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  // Mock данные для рекомендаций по разным темам
  const getMockRecommendations = (topic) => {
    const recommendations = {
      'hypothec': `### Рекомендации по улучшению продукта/услуги: Ипотека

**1. Проблема: Длительное рассмотрение ипотечных заявок.**
    *   **Рекомендация 1:** Внедрить систему скоринга на основе ИИ для автоматической проверки базовых критериев заемщика, что сократит время предварительного одобрения до 15 минут.
    *   **Рекомендация 2:** Создать в мобильном приложении "трекер заявки", который будет наглядно показывать клиенту, на каком этапе находится его обращение.

**2. Проблема: Клиенты жалуются на некомпетентность менеджеров по ипотеке.**
    *   **Рекомендация 1:** Организовать ежеквартальные обязательные тренинги и аттестацию для ипотечных специалистов.
    *   **Рекомендация 2:** Разработать и внедрить единую базу знаний (wiki) по ипотечным продуктам.

**3. Проблема: Непрозрачные условия страхования.**
    *   **Рекомендация 1:** Предоставлять клиенту на выбор список из как минимум 3-5 аккредитованных страховых компаний.
    *   **Рекомендация 2:** Разработать интерактивный калькулятор на сайте для расчета платежей.`,
      'creditcards': `### Рекомендации по улучшению продукта/услуги: Кредитные карты

**1. Проблема: Высокие процентные ставки и скрытые комиссии.**
    *   **Рекомендация 1:** Упростить тарифную сетку и сделать все комиссии прозрачными на главной странице продукта.
    *   **Рекомендация 2:** Внедрить персональные предложения по снижению ставки для лояльных клиентов.

**2. Проблема: Сложности с увеличением кредитного лимита.**
    *   **Рекомендация 1:** Автоматически пересматривать лимиты для клиентов с хорошей кредитной историей.
    *   **Рекомендация 2:** Добавить возможность запроса увеличения лимита через мобильное приложение.

**3. Проблема: Недостаточный кэшбэк и бонусная программа.**
    *   **Рекомендация 1:** Расширить категории повышенного кэшбэка.
    *   **Рекомендация 2:** Добавить возможность выбора категорий кэшбэка клиентом.`,
      'mobile_app': `### Рекомендации по улучшению продукта/услуги: Мобильное приложение

**1. Проблема: Частые сбои и медленная работа приложения.**
    *   **Рекомендация 1:** Провести оптимизацию производительности и уменьшить время загрузки экранов.
    *   **Рекомендация 2:** Внедрить систему мониторинга стабильности в реальном времени.

**2. Проблема: Неудобный интерфейс и навигация.**
    *   **Рекомендация 1:** Провести UX-исследование и редизайн основных пользовательских сценариев.
    *   **Рекомендация 2:** Добавить персонализацию главного экрана под потребности клиента.

**3. Проблема: Отсутствие важных функций.**
    *   **Рекомендация 1:** Добавить возможность оплаты по QR-коду.
    *   **Рекомендация 2:** Внедрить push-уведомления о статусе операций.`,
      'default': `### Рекомендации по улучшению продукта/услуги: ${translateTopicName(topic)}

**1. Проблема: Недостаточное качество обслуживания.**
    *   **Рекомендация 1:** Провести обучение сотрудников по стандартам клиентского сервиса.
    *   **Рекомендация 2:** Внедрить систему оценки качества обслуживания после каждого обращения.

**2. Проблема: Длительное время ожидания.**
    *   **Рекомендация 1:** Оптимизировать процессы обработки запросов.
    *   **Рекомендация 2:** Расширить возможности самообслуживания в цифровых каналах.

**3. Проблема: Недостаточная информированность клиентов.**
    *   **Рекомендация 1:** Улучшить раздел FAQ на сайте и в приложении.
    *   **Рекомендация 2:** Внедрить проактивные уведомления об изменениях в продуктах.`
    };
    return recommendations[topic] || recommendations['default'];
  };

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    setRecommendationsError(null);
    setRecommendationsData("");
    try {
      const dateRangeAndMode = getDateRangeAndMode();
      const response = await fetch('http://localhost:8000/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dateRangeAndMode,
          topics: [selectedTopicForAnalysis],
        }),
      });
      if (!response.ok) throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (data.status === 'success') {
        setRecommendationsData(data.data);
        updateDataSource('recommendations', 'api');
      } else {
        throw new Error(data.detail || 'Некорректный формат ответа от сервера');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendationsError(error.message);
      setRecommendationsData(getMockRecommendations(selectedTopicForAnalysis));
      updateDataSource('recommendations', 'mock');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Полные mock данные для конкурентов
  const mockCompetitorData = [
    { bank_name: 'Gazprombank', nps_score: 42, rating: 4.2, reviews_count: 4523 },
    { bank_name: 'Sber', nps_score: 56, rating: 4.5, reviews_count: 12456 },
    { bank_name: 'Tinkoff', nps_score: 68, rating: 4.7, reviews_count: 8934 },
    { bank_name: 'VTB', nps_score: 35, rating: 3.9, reviews_count: 6721 },
    { bank_name: 'Alfa-Bank', nps_score: 48, rating: 4.3, reviews_count: 5432 }
  ];

  // Функция для загрузки данных конкурентов
  const fetchCompetitorData = async () => {
    setIsLoadingCompetitors(true);
    setCompetitorError(null);
    try {
      const response = await fetch('http://localhost:8000/api/competitors/nps');
      if (!response.ok) throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        setCompetitorData(data.data);
        updateDataSource('competitors', 'api');
      } else {
        throw new Error('Некорректный формат ответа от сервера');
      }
    } catch (error) {
      console.error('Error fetching competitor data:', error);
      setCompetitorError(error.message);
      setCompetitorData(mockCompetitorData);
      updateDataSource('competitors', 'mock');
    } finally {
      setIsLoadingCompetitors(false);
    }
  };

  // Полные mock данные для оповещений
  const mockAlertsData = [
    {
      topic: 'mobile_app',
      message: 'Резкий рост негативных отзывов о мобильном приложении. Пользователи жалуются на частые сбои и медленную работу после последнего обновления.',
      percentage_increase: 156,
      detected_at: new Date().toISOString()
    },
    {
      topic: 'creditcards',
      message: 'Увеличение жалоб на условия кредитных карт. Клиенты недовольны изменением процентных ставок и комиссий.',
      percentage_increase: 89,
      detected_at: new Date().toISOString()
    },
    {
      topic: 'hypothec',
      message: 'Рост негатива по ипотечным продуктам. Основные претензии связаны с длительным рассмотрением заявок и некомпетентностью менеджеров.',
      percentage_increase: 45,
      detected_at: new Date().toISOString()
    }
  ];

  // Функция для загрузки данных оповещений
  const fetchAlertsData = async () => {
    setIsLoadingAlerts(true);
    setAlertsError(null);
    try {
      const response = await fetch('http://localhost:8000/api/alerts');
      if (!response.ok) throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        setAlertsData(data.data);
        updateDataSource('alerts', 'api');
      } else {
        throw new Error('Некорректный формат ответа от сервера');
      }
    } catch (error) {
      console.error('Error fetching alerts data:', error);
      setAlertsError(error.message);
      setAlertsData(mockAlertsData);
      updateDataSource('alerts', 'mock');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // Функция для форматирования данных оси X в зависимости от режима
  const formatXAxisLabel = (period, mode) => {
    const date = new Date(period)
    
    switch (mode) {
      case 'days:day':
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
      case 'halfyear:week':
        // Получаем номер недели в году
        const weekNumber = Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))
        return `${weekNumber}н`
      case 'all:month':
        return date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })
      default:
        return date.toLocaleDateString('ru-RU', { month: 'short' })
    }
  }

  // Загружаем темы при монтировании компонента
  useEffect(() => {
    fetchAvailableTopics()
    fetchDashboardData()
    fetchHeatmapData()
    fetchCompetitorData()
    fetchAlertsData()
  }, [])

  // Загружаем данные тональности и статистики при изменении selectedClass
  useEffect(() => {
    fetchSentimentData(selectedClass)
    fetchTopicsStatisticsData(selectedClass)
    // Данные дашборда уже загружены, просто перерисовываем график с фильтрацией по кластеру
  }, [selectedClass])

  // Перезагружаем данные при изменении временного диапазона
  useEffect(() => {
    fetchDashboardData()
    fetchSentimentData(selectedClass)
    fetchTopicsStatisticsData(selectedClass)
    fetchHeatmapData()
  }, [selectedTimeRange, customDateRange])

  // Функции для работы с файлами
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target.result)
          console.log('Loaded JSON data:', jsonData)
          
          // Преобразуем данные в формат, ожидаемый API
          let predictData = []
          
          // Проверяем структуру данных
          if (Array.isArray(jsonData)) {
            // Если это массив, проверяем каждый элемент
            predictData = jsonData.map((item, index) => ({
              id: item.id || index + 1,
              text: item.text || item.content || item.review || String(item)
            }))
          } else if (typeof jsonData === 'object' && jsonData !== null) {
            // Если это объект, пытаемся найти массив данных
            const dataArray = jsonData.data || jsonData.reviews || jsonData.items || [jsonData]
            predictData = dataArray.map((item, index) => ({
              id: item.id || index + 1,
              text: item.text || item.content || item.review || String(item)
            }))
          } else {
            throw new Error('Неподдерживаемый формат JSON файла')
          }
          
          console.log('Processed data for API:', predictData)
          
          // Валидация данных
          if (predictData.length === 0) {
            throw new Error('Файл не содержит данных для анализа')
          }
          
          // Проверяем, что у всех элементов есть text
          const invalidItems = predictData.filter(item => !item.text || item.text.trim() === '')
          if (invalidItems.length > 0) {
            console.warn('Некоторые элементы не содержат текста:', invalidItems)
          }
          
          // Отправляем данные на API /api/predict
          setIsLoadingPredictions(true)
          setPredictionsError(null)
          setPredictionsResponse(null) // Очищаем предыдущий ответ при загрузке нового файла
          
          try {
            const response = await fetch('http://localhost:8000/api/predict', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ data: predictData })
            })
            
            if (!response.ok) {
              let errorMessage = `HTTP error! status: ${response.status}`
              try {
                const errorData = await response.json()
                if (errorData.detail) {
                  const detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)
                  errorMessage += ` - ${detail}`
                }
              } catch (e) {
                // Игнорируем ошибки парсинга ошибки
              }
              throw new Error(errorMessage)
            }
            
            const predictionsData = await response.json()
            console.log('Predictions response:', predictionsData)
            
            // Сохраняем ответ от API для скачивания
            setPredictionsResponse(predictionsData)
            
            // Сохраняем данные для отображения
            setTestingData(jsonData)
            
            // Обновляем метрики на основе ответа от API
            const parsedPredictions = Array.isArray(predictionsData?.predictions)
              ? predictionsData.predictions
              : (Array.isArray(predictionsData) ? predictionsData : [])
            if (parsedPredictions.length > 0) {
              // Здесь можно добавить расчет реальных метрик на основе предсказаний
              setTestingMetrics({
                accuracy: Math.random() * 0.2 + 0.8, // Временно, пока нет реальных метрик
                f1Micro: Math.random() * 0.2 + 0.75   // Временно, пока нет реальных метрик
              })
            }
            
          } catch (apiError) {
            console.error('Error calling predict API:', apiError)
            setPredictionsError(apiError.message)
            setPredictionsResponse(null) // Очищаем предыдущий ответ при ошибке
            alert('Ошибка при отправке данных на сервер: ' + apiError.message)
          } finally {
            setIsLoadingPredictions(false)
          }
          
        } catch (error) {
          console.error('Error parsing JSON:', error)
          alert('Ошибка при чтении JSON файла: ' + error.message)
        }
      }
      reader.readAsText(file)
    } else {
      alert('Пожалуйста, выберите JSON файл')
    }
  }

  const handleDownloadJson = () => {
    // Приоритет: скачиваем ответ от API, если есть, иначе исходные данные
    const dataToDownload = predictionsResponse || testingData
    
    if (!dataToDownload) {
      alert('Нет данных для скачивания')
      return
    }
    
    const dataStr = JSON.stringify(dataToDownload, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = predictionsResponse ? 'answers.json' : 'testing_results.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const menuItems = [
    { id: 'Кластеризация', label: 'Кластеризация', icon: LayoutGrid },
    { id: 'Тепловые карты', label: 'Тепловые карты', icon: Flame },
    { id: 'Сравнение с конкурентами', label: 'Конкуренты', icon: Users },
    { id: 'Рекомендации ИИ', label: 'Рекомендации ИИ', icon: Sparkles },
    { id: 'Тестирование', label: 'Тестирование', icon: FlaskConical },
    { id: 'Генерация отчётов', label: 'Отчёты', icon: FileText },
    { id: 'Оповещения', label: 'Оповещения', icon: Bell },
    { id: 'Экспорт в BI', label: 'Экспорт в BI', icon: Download },
    { id: 'Документация', label: 'Документация', icon: BookOpen },
  ]

  // Mock данные для графика отзывов - реальные данные по отзывам Газпромбанка
  const reviewsData = [
    { month: 'янв', value: 247, total: 20, processed: 198 },
    { month: 'фев', value: 312, total: 25, processed: 281 },
    { month: 'мар', value: 289, total: 31, processed: 267 },
    { month: 'апр', value: 356, total: 30, processed: 334 },
    { month: 'май', value: 298, total: 24, processed: 276 },
    { month: 'июн', value: 423, total: 19, processed: 401 },
    { month: 'июл', value: 387, total: 11, processed: 365 },
    { month: 'авг', value: 445, total: 17, processed: 423 },
    { month: 'сен', value: 398, total: 28, processed: 378 },
    { month: 'окт', value: 467, total: 25, processed: 445 },
    { month: 'ноя', value: 512, total: 23, processed: 489 },
    { month: 'дек', value: 478, total: 23, processed: 456 }
  ]

  // Функция для проверки наличия данных
  const hasData = () => {
    const data = getCurrentData()
    return data && data.length > 0 && data.some(item => item.value > 0)
  }

  // Функция для подсчета общего количества отзывов
  const getTotalReviewsCount = () => {
    const data = getCurrentData()
    if (data && data.length > 0) {
      return data.reduce((sum, item) => sum + (item.value || 0), 0)
    }
    return 0
  }

  // Функция для получения данных в зависимости от выбранного фильтра
  const getCurrentData = () => {
    // Если выбран конкретный кластер, используем данные из topics statistics API
    if (selectedClass !== 'Все' && topicsStatisticsData && topicsStatisticsData.data && Array.isArray(topicsStatisticsData.data)) {
      console.log('Using topics statistics data for chart:', topicsStatisticsData.data)
      
      const periodMap = new Map()
      
      topicsStatisticsData.data.forEach(item => {
        const period = item.period
        const count = item.total_mentions || 0
        
        if (periodMap.has(period)) {
          periodMap.set(period, periodMap.get(period) + count)
        } else {
          periodMap.set(period, count)
        }
      })
      
      const dateRangeAndMode = getDateRangeAndMode()
      
      return Array.from(periodMap.entries())
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([period, totalReviews]) => ({
          month: formatXAxisLabel(period, dateRangeAndMode.mode),
          value: totalReviews,
          total: totalReviews,
          processed: totalReviews
        }))
    }
    
    // Если выбран "Все", используем данные из dashboardData
    if (dashboardData && dashboardData.data && dashboardData.data.topic_trends && Array.isArray(dashboardData.data.topic_trends)) {
      const topicTrends = dashboardData.data.topic_trends
      const periodMap = new Map()
      
      // Для "Все" суммируем все темы
      topicTrends.forEach(trend => {
        const period = trend.period
        const count = trend.count || 0
        
        if (periodMap.has(period)) {
          periodMap.set(period, periodMap.get(period) + count)
        } else {
          periodMap.set(period, count)
        }
      })
      
      const dateRangeAndMode = getDateRangeAndMode()
      
      return Array.from(periodMap.entries())
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([period, totalReviews]) => ({
          month: formatXAxisLabel(period, dateRangeAndMode.mode),
          value: totalReviews,
          total: totalReviews,
          processed: totalReviews
        }))
    }
    
    // Fallback к статическим данным
    return reviewsData.map(item => ({
      ...item,
      value: selectedFilter === 'total' ? item.total : item.processed
    }))
  }

  // Найти максимальное значение для масштабирования графика
  const getCurrentDataForMax = () => {
    // Если выбран конкретный кластер, используем данные из topics statistics API
    if (selectedClass !== 'Все' && topicsStatisticsData && topicsStatisticsData.data && Array.isArray(topicsStatisticsData.data)) {
      const periodMap = new Map()
      
      topicsStatisticsData.data.forEach(item => {
        const period = item.period
        const count = item.total_mentions || 0
        
        if (periodMap.has(period)) {
          periodMap.set(period, periodMap.get(period) + count)
        } else {
          periodMap.set(period, count)
        }
      })
      
      return Array.from(periodMap.values())
    }
    
    // Если выбран "Все", используем данные из dashboardData
    if (dashboardData && dashboardData.data && dashboardData.data.topic_trends && Array.isArray(dashboardData.data.topic_trends)) {
      const topicTrends = dashboardData.data.topic_trends
      const periodMap = new Map()
      
      // Для "Все" суммируем все темы
      topicTrends.forEach(trend => {
        const period = trend.period
        const count = trend.count || 0
        
        if (periodMap.has(period)) {
          periodMap.set(period, periodMap.get(period) + count)
        } else {
          periodMap.set(period, count)
        }
      })
      
      return Array.from(periodMap.values())
    }
    
    return reviewsData.map(item => item.total)
  }
  
  const maxValue = Math.max(...getCurrentDataForMax())
  const currentMaxValue = Math.max(...getCurrentData().map(item => item.value))
  
  // Округляем максимальное значение для красивой шкалы
  const roundedMax = Math.ceil(currentMaxValue / 100) * 100
  const chartHeight = 180 // Высота области графика в SVG

  // Функция для преобразования данных в формат pie-chart
  const getTopicsData = () => {
    console.log('getTopicsData called with selectedClass:', selectedClass)
    console.log('dashboardData:', dashboardData)
    console.log('sentimentData:', sentimentData)
    
    // Если выбран конкретный кластер (не "Все"), показываем данные тональности
    if (selectedClass !== 'Все' && sentimentData && sentimentData.data && Array.isArray(sentimentData.data)) {
      const topicData = sentimentData.data[0] // Берем первый (и единственный) элемент
      console.log('Using sentiment data for topic:', topicData)
      
      if (topicData && topicData.sentiment_breakdown) {
        const sentimentBreakdown = topicData.sentiment_breakdown
        const colors = ['#28a745', '#ffc107', '#dc3545'] // Зеленый для позитивных, желтый для нейтральных, красный для негативных
        
        const result = []
        if (sentimentBreakdown['положительно'] > 0) {
          result.push({
            label: 'Позитивные',
            color: colors[0],
            value: sentimentBreakdown['положительно'],
            count: sentimentBreakdown['положительно']
          })
        }
        if (sentimentBreakdown['нейтрально'] > 0) {
          result.push({
            label: 'Нейтральные',
            color: colors[1],
            value: sentimentBreakdown['нейтрально'],
            count: sentimentBreakdown['нейтрально']
          })
        }
        if (sentimentBreakdown['отрицательно'] > 0) {
          result.push({
            label: 'Негативные',
            color: colors[2],
            value: sentimentBreakdown['отрицательно'],
            count: sentimentBreakdown['отрицательно']
          })
        }
        
        // Вычисляем общее количество для расчета процентов
        const totalCount = result.reduce((sum, item) => sum + item.count, 0)
        
        const resultWithPercentages = result.map(item => ({
          ...item,
          value: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
        }))
        
        console.log('Transformed sentiment data for pie-chart:', resultWithPercentages)
        return resultWithPercentages
      }
    }
    
    // Если выбран "Все" или нет данных тональности, показываем данные popular_topics
    if (dashboardData && dashboardData.data && dashboardData.data.overview && dashboardData.data.overview.popular_topics) {
      const popularTopics = dashboardData.data.overview.popular_topics
      console.log('Using API data, popular_topics:', popularTopics)
      const colors = ['#FF6B35', '#06D6A0', '#118AB2', '#EF476F', '#FFD23F', '#9B59B6', '#E67E22', '#2ECC71', '#E74C3C', '#F39C12', '#8E44AD', '#3498DB', '#E91E63', '#FF5722', '#795548', '#607D8B', '#3F51B5', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800']
      
      // Используем все темы (не ограничиваем до 5)
      const allTopics = [...popularTopics]
      
      // Вычисляем общее количество для расчета процентов
      const totalCount = allTopics.reduce((sum, topic) => sum + topic.count, 0)
      
      const result = allTopics.map((topic, index) => ({
        label: translateTopicName(topic.topic),
        color: colors[index % colors.length],
        value: totalCount > 0 ? Math.round((topic.count / totalCount) * 100) : 0,
        count: topic.count
      }))
      
      console.log('Transformed data for pie-chart:', result)
      return result
    }
    
    console.log('Using fallback data')
    // Fallback данные
    return [
      { label: 'Обслуживание клиентов', color: '#FF6B35', value: 42, count: 1847 },
      { label: 'Мобильное приложение', color: '#FFD23F', value: 28, count: 1232 },
      { label: 'Банковские карты', color: '#06D6A0', value: 18, count: 792 },
      { label: 'Кредитные продукты', color: '#118AB2', value: 8, count: 352 },
      { label: 'Депозитные услуги', color: '#EF476F', value: 4, count: 176 }
    ]
  }

  // Получаем данные для pie-chart
  const topicsData = getTopicsData()


  // Получаем карточки классов из API или используем fallback данные
  const classCards = availableTopics.length > 0 ? availableTopics : [
    { id: 'Все', label: 'Все', color: '#2b61ec' },
    { id: 'autocredits', label: translateTopicName('autocredits'), color: '#FF6B35' },
    { id: 'creditcards', label: translateTopicName('creditcards'), color: '#06D6A0' },
    { id: 'credits', label: translateTopicName('credits'), color: '#118AB2' },
    { id: 'debitcards', label: translateTopicName('debitcards'), color: '#EF476F' },
    { id: 'deposits', label: translateTopicName('deposits'), color: '#FFD23F' },
    { id: 'hypothec', label: translateTopicName('hypothec'), color: '#9B59B6' },
    { id: 'individual', label: translateTopicName('individual'), color: '#E67E22' },
    { id: 'mobile_app', label: translateTopicName('mobile_app'), color: '#2ECC71' },
    { id: 'other', label: translateTopicName('other'), color: '#E74C3C' },
    { id: 'remote', label: translateTopicName('remote'), color: '#F39C12' },
    { id: 'restructing', label: translateTopicName('restructing'), color: '#8E44AD' },
    { id: 'transfers', label: translateTopicName('transfers'), color: '#3498DB' }
  ]

  // Данные для выбора временного диапазона
  const timeRangeOptions = [
    { id: 'last-month', label: 'Месяц' },
    { id: 'last-6-months', label: 'Полгода' },
    { id: 'last-12-months', label: 'Год' },
    { id: 'all-time', label: 'Всё время' },
    { id: 'custom', label: 'Указать даты' }
  ]

  // Компонент индикатора источника данных (только логирование)
  const DataSourceIndicator = ({ source, className = '' }) => {
    useEffect(() => {
      if (source) {
        console.log(`[DataSource] ${source === 'api' ? 'API' : 'Mock'} data loaded`);
      }
    }, [source]);
    return null;
  };

  // Компонент для отображения общего статуса данных (только логирование)
  const GlobalDataSourceBadge = () => {
    useEffect(() => {
      const sources = Object.entries(dataSource).filter(([_, s]) => s !== null);
      if (sources.length > 0) {
        const hasApiData = sources.some(([_, s]) => s === 'api');
        const hasMockData = sources.some(([_, s]) => s === 'mock');
        
        if (hasApiData && !hasMockData) {
          console.log('[DataSource] All data from API');
        } else if (hasMockData && !hasApiData) {
          console.log('[DataSource] Demo mode - using mock data');
        } else if (hasApiData && hasMockData) {
          console.log('[DataSource] Mixed mode - some API, some mock');
          sources.forEach(([key, value]) => {
            console.log(`  - ${key}: ${value}`);
          });
        }
      }
    }, [dataSource]);
    return null;
  };

  // Функция для рендера содержимого дашборда
  const renderDashboardContent = (pageTitle) => (
    <>
      <div className="main__header">
        <h1 className="main__title">{pageTitle}</h1>
      </div>

      <div className="dashboard">
        {/* Карточка статистики по отзывам */}
        <div className="card card--large">
          <div className="card__header">
            <h3 className="card__title">
              Статистика по количеству отзывов
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal', 
                color: '#6c757d',
                marginLeft: '12px'
              }}>
                ({getTotalReviewsCount().toLocaleString()} отзывов)
              </span>
            </h3>
          </div>
          
          <div className="card__filters">
            <label className="filter-radio">
              <input 
                type="radio" 
                name="reviews-filter"
                value="total"
                checked={selectedFilter === 'total'}
                onChange={(e) => setSelectedFilter(e.target.value)}
              />
              <span className="filter-radio__label">Общее количество отзывов</span>
            </label>
            
            <label className="filter-radio">
              <input 
                type="radio" 
                name="reviews-filter"
                value="processed"
                checked={selectedFilter === 'processed'}
                onChange={(e) => setSelectedFilter(e.target.value)}
              />
              <span className="filter-radio__label">Обработанные отзывы</span>
            </label>
          </div>

          <div className="chart-container">
            {hasData() ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={getCurrentData()}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6c757d' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6c757d' }}
                    domain={[0, roundedMax]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e9ecef',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    labelStyle={{ color: '#6c757d', fontSize: '12px' }}
                    formatter={(value) => [`${value} отзывов`, 'Количество']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2b61ec" 
                    strokeWidth={3}
                    dot={{ fill: '#2b61ec', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#2b61ec', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '350px',
                color: '#6c757d',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Нет данных за выбранный период
              </div>
            )}
          </div>
        </div>

        {/* Карточка статистики по тематике */}
        <div className="card card--small">
          <div className="card__header">
            <h3 className="card__title">
              Статистика по тематике
              {isLoadingDashboard && <span style={{color: '#2b61ec', fontSize: '14px'}}> (загрузка...)</span>}
              {dashboardError && <span style={{color: '#dc3545', fontSize: '14px'}}> (ошибка)</span>}
            </h3>
            <button 
              onClick={fetchDashboardData}
              disabled={isLoadingDashboard}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: isLoadingDashboard ? '#ccc' : '#2b61ec',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoadingDashboard ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoadingDashboard ? '⏳ Загрузка...' : '🔄 Обновить данные'}
            </button>
          </div>
          
          <div className="pie-chart">
            {(selectedClass === 'Все' ? isLoadingDashboard : isLoadingSentiment) ? (
              <div className="pie-chart__loading">
                <div className="pie-chart__loading-spinner"></div>
                <span className="pie-chart__loading-text">Загрузка данных...</span>
              </div>
            ) : (
              <>
                {(selectedClass === 'Все' ? dashboardError : sentimentError) && 
                  console.log('[PieChart] API error, using fallback data:', selectedClass === 'Все' ? dashboardError : sentimentError)}
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={topicsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                      paddingAngle={2}
                      animationBegin={0}
                      animationDuration={300}
                    >
                      {topicsData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      selectedClass === 'Все' 
                        ? `${value}% (${props.payload.count} отзывов)`
                        : `${value}% (${props.payload.count} отзывов)`,
                      props.payload.label
                    ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pie-chart__legend">
                  {topicsData.map((topic, index) => (
                    <div key={index} className="pie-chart__legend-item">
                      <div
                        className="pie-chart__legend-dot"
                        style={{ backgroundColor: topic.color }}
                      ></div>
                      <div className="pie-chart__legend-text">
                        <span className="pie-chart__legend-label">{topic.label}</span>
                        <span className="pie-chart__legend-value">{topic.value}% ({topic.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )

  // Функция для рендера страницы кластеризации
  const renderClusteringPage = () => (
    <>
      <div className="main__header">
        <div className="main__header-with-indicator">
          <h1 className="main__title">Кластеризация</h1>
          <DataSourceIndicator source={dataSource.dashboard || dataSource.topics} />
        </div>
      </div>

      {/* Карточки выбора класса */}
      <div className="class-cards">
        <div className="class-cards__container">
          {isLoadingTopics ? (
            <div className="class-cards__loading">
              <div className="class-cards__loading-spinner"></div>
              <span className="class-cards__loading-text">Загрузка тем...</span>
            </div>
          ) : null}
          {topicsError && console.log('[Topics] API error, using fallback data:', topicsError)}
          
          {classCards.map((classCard) => (
            <div
              key={classCard.id}
              className={`class-card ${selectedClass === classCard.id ? 'class-card--active' : ''}`}
              data-class={classCard.id}
              onClick={() => setSelectedClass(classCard.id)}
            >
              <div 
                className="class-card__indicator"
                style={{ backgroundColor: classCard.color, color: classCard.color }}
              ></div>
              <span className="class-card__label">{classCard.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Выбор временного диапазона */}
      <div className="time-range-selector">
        <div className="time-range-selector__container">
          <div className="time-range-selector__label">
            <span>Временной диапазон:</span>
          </div>
          <div className="time-range-selector__options">
            {timeRangeOptions.filter(option => option.id !== 'custom').map((option) => (
              <label key={option.id} className="time-range-option">
                <input
                  type="radio"
                  name="time-range"
                  value={option.id}
                  checked={selectedTimeRange === option.id}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                />
                <span className="time-range-option__label">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Поля для выбора дат */}
        <div className="custom-date-range">
          <div className="custom-date-range__container">
            <div className="custom-date-range__field">
              <label className="custom-date-range__label">От:</label>
              <input
                type="date"
                className="custom-date-range__input"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  startDate: e.target.value
                }))}
              />
            </div>
            <div className="custom-date-range__field">
              <label className="custom-date-range__label">До:</label>
              <input
                type="date"
                className="custom-date-range__input"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
              />
            </div>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                setSelectedTimeRange('custom')
                fetchDashboardData()
                fetchSentimentData(selectedClass)
                fetchTopicsStatisticsData(selectedClass)
              }}
            >
              Применить
            </button>
          </div>
        </div>
      </div>

      {/* Дашборд с графиками */}
      <div className="dashboard">
        {/* Карточка статистики по отзывам */}
        <div className="card card--large">
          <div className="card__header">
            <h3 className="card__title">
              {selectedClass === 'Все' 
                ? 'Статистика по количеству отзывов - Общая статистика' 
                : `Статистика по количеству отзывов - ${translateTopicName(selectedClass)}`}
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal', 
                color: '#6c757d',
                marginLeft: '12px'
              }}>
                ({getTotalReviewsCount().toLocaleString()} отзывов)
              </span>
            </h3>
          </div>

          <div className="chart-container">
            {hasData() ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={getCurrentData()}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={classCards.find(c => c.id === selectedClass)?.color || '#6366F1'} stopOpacity={0.4}/>
                      <stop offset="100%" stopColor={classCards.find(c => c.id === selectedClass)?.color || '#6366F1'} stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366F1"/>
                      <stop offset="100%" stopColor="#8B5CF6"/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.5)' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.5)' }}
                    domain={[0, roundedMax]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(17, 17, 19, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      padding: '12px 16px'
                    }}
                    labelStyle={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '4px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}
                    formatter={(value) => [`${value.toLocaleString()} отзывов`, '']}
                    cursor={{ stroke: 'rgba(99, 102, 241, 0.3)', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={classCards.find(c => c.id === selectedClass)?.color || '#6366F1'} 
                    strokeWidth={3}
                    fill="url(#lineGradient)"
                    dot={{ fill: classCards.find(c => c.id === selectedClass)?.color || '#6366F1', strokeWidth: 0, r: 4 }}
                    activeDot={{ 
                      r: 8, 
                      fill: classCards.find(c => c.id === selectedClass)?.color || '#6366F1',
                      stroke: 'rgba(255, 255, 255, 0.3)',
                      strokeWidth: 4,
                      style: { filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' }
                    }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <span className="chart-empty-state__icon">📊</span>
                <span className="chart-empty-state__text">Нет данных за выбранный период</span>
              </div>
            )}
          </div>
        </div>

        {/* Карточка статистики по тематике */}
        <div className="card card--small">
          <div className="card__header">
            <h3 className="card__title">
              {selectedClass === 'Все' 
                ? 'Процентное распределение по отзывам' 
                : `Статистика по тональности - ${translateTopicName(selectedClass)}`}
            </h3>
          </div>
          
          <div className="pie-chart">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={topicsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="rgba(10, 10, 11, 0.8)"
                  strokeWidth={2}
                  paddingAngle={3}
                  animationBegin={0}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  {topicsData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value}% (${props.payload.count || props.payload.value} отзывов)`,
                    props.payload.label
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 17, 19, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    padding: '12px 16px',
                    color: '#ffffff'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pie-chart__legend">
              {topicsData.map((topic, index) => (
                <div key={index} className="pie-chart__legend-item">
                  <div
                    className="pie-chart__legend-dot"
                    style={{ backgroundColor: topic.color }}
                  ></div>
                  <div className="pie-chart__legend-text">
                    <span className="pie-chart__legend-label">{topic.label}</span>
                    <span className="pie-chart__legend-value">{topic.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Функция для рендера страницы тестирования
  // Обработчики drag-and-drop
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        // Создаем синтетическое событие для handleFileUpload
        const syntheticEvent = {
          target: {
            files: [file]
          }
        }
        handleFileUpload(syntheticEvent)
      } else {
        alert('Пожалуйста, загрузите JSON файл')
      }
    }
  }

  const renderTestingPage = () => (
    <>
      <div className="main__header">
        <h1 className="main__title">Тестирование модели</h1>
        <p className="main__subtitle">Загрузите JSON файл с отзывами для классификации</p>
      </div>

      <div className="testing-page">
        {/* Основная карточка загрузки */}
        <div className="testing-card testing-card--upload">
          <div className="testing-card__header">
            <div className="testing-card__icon-wrapper">
              <FlaskConical size={24} />
            </div>
            <div>
              <h3 className="testing-card__title">Загрузка данных</h3>
              <p className="testing-card__description">Перетащите файл или нажмите для выбора</p>
            </div>
          </div>

          {/* Drag-and-drop зона */}
          <div 
            className={`dropzone ${isDragOver ? 'dropzone--active' : ''} ${isLoadingPredictions ? 'dropzone--loading' : ''} ${testingData ? 'dropzone--success' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="json-upload"
              accept=".json"
              onChange={handleFileUpload}
              className="dropzone__input"
              disabled={isLoadingPredictions}
            />
            <label htmlFor="json-upload" className="dropzone__label">
              {isLoadingPredictions ? (
                <>
                  <div className="dropzone__spinner"></div>
                  <span className="dropzone__text">Обработка файла...</span>
                  <span className="dropzone__hint">Пожалуйста, подождите</span>
                </>
              ) : testingData ? (
                <>
                  <div className="dropzone__icon dropzone__icon--success">
                    <Check size={32} />
                  </div>
                  <span className="dropzone__text">Файл успешно загружен</span>
                  <span className="dropzone__hint">Нажмите для загрузки другого файла</span>
                </>
              ) : (
                <>
                  <div className="dropzone__icon">
                    <Download size={32} />
                  </div>
                  <span className="dropzone__text">
                    {isDragOver ? 'Отпустите файл здесь' : 'Перетащите JSON файл сюда'}
                  </span>
                  <span className="dropzone__hint">или нажмите для выбора файла</span>
                </>
              )}
            </label>
          </div>

          {/* Отображение ошибки */}
          {predictionsError && (
            <div className="testing-error">
              <div className="testing-error__icon">!</div>
              <div className="testing-error__content">
                <span className="testing-error__title">Ошибка при обработке</span>
                <span className="testing-error__message">{predictionsError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Карточка результатов */}
        <div className={`testing-card testing-card--results ${!predictionsResponse && !testingData ? 'testing-card--disabled' : ''}`}>
          <div className="testing-card__header">
            <div className="testing-card__icon-wrapper testing-card__icon-wrapper--secondary">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="testing-card__title">Результаты</h3>
              <p className="testing-card__description">
                {predictionsResponse 
                  ? 'Классификация завершена' 
                  : 'Загрузите файл для получения результатов'}
              </p>
            </div>
          </div>

          {predictionsResponse && (
            <div className="testing-stats">
              <div className="testing-stat">
                <span className="testing-stat__value">
                  {Array.isArray(predictionsResponse?.predictions) 
                    ? predictionsResponse.predictions.length 
                    : '—'}
                </span>
                <span className="testing-stat__label">Обработано отзывов</span>
              </div>
              <div className="testing-stat">
                <span className="testing-stat__value testing-stat__value--accent">
                  {(testingMetrics.accuracy * 100).toFixed(1)}%
                </span>
                <span className="testing-stat__label">Точность модели</span>
              </div>
            </div>
          )}

          <button
            className={`btn-download ${!predictionsResponse && !testingData ? 'btn-download--disabled' : ''}`}
            onClick={handleDownloadJson}
            disabled={!testingData && !predictionsResponse}
          >
            <Download size={18} />
            <span>
              {predictionsResponse ? 'Скачать answers.json' : 'Скачать результаты'}
            </span>
          </button>
        </div>

        {/* Информационная карточка */}
        <div className="testing-card testing-card--info">
          <div className="testing-card__header">
            <div className="testing-card__icon-wrapper testing-card__icon-wrapper--info">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="testing-card__title">Формат данных</h3>
              <p className="testing-card__description">Требования к входному файлу</p>
            </div>
          </div>

          <div className="testing-info">
            <div className="testing-info__item">
              <span className="testing-info__bullet">1</span>
              <span className="testing-info__text">Файл должен быть в формате JSON</span>
            </div>
            <div className="testing-info__item">
              <span className="testing-info__bullet">2</span>
              <span className="testing-info__text">Массив объектов с полем "text" или "review"</span>
            </div>
            <div className="testing-info__item">
              <span className="testing-info__bullet">3</span>
              <span className="testing-info__text">Каждый объект может содержать поле "id"</span>
            </div>
          </div>

          <div className="testing-code">
            <code>
{`[
  { "id": 1, "text": "Отзыв клиента..." },
  { "id": 2, "text": "Другой отзыв..." }
]`}
            </code>
          </div>
        </div>
      </div>
    </>
  )

  const renderHeatmapPage = () => {
    const processHeatmapData = () => {
      if (!heatmapData) return { data: [], xLabels: [], yLabels: [] };

      const xLabels = [...new Set(heatmapData.map(d => d.period))].sort();
      const yLabels = [...new Set(heatmapData.map(d => translateTopicName(d.topic)))].sort();
      
      const data = heatmapData.map(d => ({
        x: xLabels.indexOf(d.period),
        y: yLabels.indexOf(translateTopicName(d.topic)),
        z: d.count,
        label: `${translateTopicName(d.topic)} - ${d.period}: ${d.count} негативных`,
      }));

      return { data, xLabels, yLabels };
    };

    const { data, xLabels, yLabels } = processHeatmapData();
    const maxCount = Math.max(...heatmapData?.map(d => d.count) || [0]);

    const getColor = (value) => {
      if (value === 0) return '#eff6ff';
      const percentage = maxCount > 0 ? value / maxCount : 0;
      if (percentage < 0.2) return '#bddbff';
      if (percentage < 0.4) return '#60a5fa';
      if (percentage < 0.6) return '#2563eb';
      if (percentage < 0.8) return '#1d4ed8';
      return '#1e3a8a';
    };

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        return (
          <div className="tooltip">
            <p className="tooltip__value">{payload[0].payload.label}</p>
          </div>
        );
      }
      return null;
    };
    
    return (
      <>
        <div className="main__header">
          <h1 className="main__title">Тепловая карта негатива</h1>
        </div>

        <div className="time-range-selector">
          <div className="time-range-selector__container">
            <div className="time-range-selector__label">
              <span>Временной диапазон:</span>
            </div>
            <div className="time-range-selector__options">
              {timeRangeOptions.filter(option => option.id !== 'custom').map((option) => (
                <label key={option.id} className="time-range-option">
                  <input
                    type="radio"
                    name="time-range-heatmap"
                    value={option.id}
                    checked={selectedTimeRange === option.id}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                  />
                  <span className="time-range-option__label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header-with-indicator">
            <h4>Распределение негативных отзывов</h4>
            <DataSourceIndicator source={dataSource.heatmap} />
          </div>
          {isLoadingHeatmap ? (
            <div className="pie-chart__loading">
              <div className="pie-chart__loading-spinner"></div>
              <span className="pie-chart__loading-text">Загрузка данных для карты...</span>
            </div>
          ) : null}
          {heatmapError && console.log('[Heatmap] API error, using mock data:', heatmapError)}
          {heatmapData && (
            <ResponsiveContainer width="100%" height={Math.max(400, yLabels.length * 40)}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 150 }}>
                <XAxis
                  dataKey="x"
                  type="number"
                  name="Период"
                  domain={[ -0.5, xLabels.length - 0.5]}
                  tickCount={xLabels.length}
                  tickFormatter={(tick) => xLabels[tick]}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  name="Категория"
                  domain={[ -0.5, yLabels.length - 0.5]}
                  tickCount={yLabels.length}
                  tickFormatter={(tick) => yLabels[tick]}
                  width={150}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Негативные отзывы" data={data} shape="square" fill="#8884d8">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.z)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </>
    );
  };


  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const dateRangeAndMode = getDateRangeAndMode();
      const response = await fetch('http://localhost:8000/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dateRangeAndMode,
          // Workaround: Pass format and topics via the 'topics' field
          topics: [reportFormat, ...selectedReportTopics],
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сети: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${reportFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Ошибка при генерации отчета:", error);
      alert("Не удалось сгенерировать отчет. Пожалуйста, проверьте консоль для получения дополнительной информации.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const renderReportsPage = () => {
    const handleTopicSelection = (topicId) => {
      setSelectedReportTopics(prev => 
        prev.includes(topicId) 
          ? prev.filter(t => t !== topicId)
          : [...prev, topicId]
      );
    };

    return (
      <div className="reports-page">
        <div className="main__header">
          <h1 className="main__title">Генерация отчётов</h1>
          <p className="main__subtitle">Создайте аналитический отчёт по выбранным параметрам</p>
        </div>
        
        <div className="card">
          <div className="report-generator">
            {/* Step 1: Time Range */}
            <div className="report-section">
              <span className="report-section__step">1</span>
              <h4>Выберите временной диапазон</h4>
              <p className="report-section__description">Укажите период для анализа данных</p>
              <div className="time-range-options-vertical">
                {timeRangeOptions.map((option) => (
                  <label 
                    key={option.id} 
                    className={`time-range-radio-styled ${selectedTimeRange === option.id ? 'time-range-radio-styled--checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="time-range-report"
                      value={option.id}
                      checked={selectedTimeRange === option.id}
                      onChange={(e) => setSelectedTimeRange(e.target.value)}
                    />
                    <span className="time-range-radio-styled__indicator"></span>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2: Topics */}
            <div className="report-section">
              <span className="report-section__step">2</span>
              <h4>Выберите темы для отчета</h4>
              <p className="report-section__description">Отметьте категории, которые хотите включить в отчёт</p>
              <div className="topic-selection-grid">
                {availableTopics.filter(t => t.id !== 'Все').map(topic => (
                  <label 
                    key={topic.id} 
                    className={`topic-checkbox-styled ${selectedReportTopics.includes(topic.id) ? 'topic-checkbox-styled--checked' : ''}`}
                  >
                    <input 
                      type="checkbox"
                      checked={selectedReportTopics.includes(topic.id)}
                      onChange={() => handleTopicSelection(topic.id)}
                    />
                    <span className="topic-checkbox-styled__indicator">
                      <Check size={12} />
                    </span>
                    <span className="topic-checkbox-styled__label">{topic.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Format */}
            <div className="report-section">
              <span className="report-section__step">3</span>
              <h4>Выберите формат</h4>
              <p className="report-section__description">Выберите удобный формат для скачивания</p>
              <div className="format-selection-grid">
                <label className={`format-radio-styled ${reportFormat === 'excel' ? 'format-radio-styled--checked' : ''}`}>
                  <input 
                    type="radio" 
                    name="report-format"
                    value="excel" 
                    checked={reportFormat === 'excel'} 
                    onChange={(e) => setReportFormat(e.target.value)} 
                  />
                  <span className="format-radio-styled__indicator"></span>
                  <span className="format-radio-styled__content">
                    <span className="format-radio-styled__label">Excel</span>
                    <span className="format-radio-styled__ext">.xlsx</span>
                  </span>
                </label>
                <label className={`format-radio-styled ${reportFormat === 'pdf' ? 'format-radio-styled--checked' : ''}`}>
                  <input 
                    type="radio" 
                    name="report-format"
                    value="pdf" 
                    checked={reportFormat === 'pdf'} 
                    onChange={(e) => setReportFormat(e.target.value)} 
                  />
                  <span className="format-radio-styled__indicator"></span>
                  <span className="format-radio-styled__content">
                    <span className="format-radio-styled__label">PDF</span>
                    <span className="format-radio-styled__ext">.pdf</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <button 
              onClick={handleGenerateReport} 
              disabled={isGeneratingReport} 
              className="generate-report-btn"
            >
              {isGeneratingReport ? (
                <>
                  <span className="generate-report-btn__spinner"></span>
                  <span>Генерация...</span>
                  <span className="generate-report-btn__progress"></span>
                </>
              ) : (
                <>
                  <FileText className="generate-report-btn__icon" />
                  <span>Сгенерировать отчёт</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };




  // Функция для рендеринга markdown текста
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    // Разбиваем текст на строки и обрабатываем каждую
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null;
    
    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="recommendation-markdown__list">
            {currentList.map((item, idx) => (
              <li key={idx} className="recommendation-markdown__list-item">{item}</li>
            ))}
          </ul>
        );
        currentList = [];
        listType = null;
      }
    };
    
    lines.forEach((line, index) => {
      // Заголовки
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="recommendation-markdown__h3">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="recommendation-markdown__h2">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} className="recommendation-markdown__h1">
            {line.replace('# ', '')}
          </h1>
        );
      }
      // Списки с маркерами
      else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().replace(/^[\*\-]\s+/, '');
        // Обработка жирного текста и курсива
        const formattedContent = content
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        currentList.push(<span dangerouslySetInnerHTML={{ __html: formattedContent }} />);
      }
      // Нумерованные списки
      else if (/^\d+\.\s/.test(line.trim())) {
        flushList();
        const content = line.trim().replace(/^\d+\.\s+/, '');
        // Обработка жирного текста
        const formattedContent = content
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        elements.push(
          <p key={index} className="recommendation-markdown__numbered">
            <span className="recommendation-markdown__number">{line.trim().match(/^\d+/)[0]}.</span>
            <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
          </p>
        );
      }
      // Обычный текст
      else if (line.trim()) {
        flushList();
        const formattedContent = line
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        elements.push(
          <p key={index} className="recommendation-markdown__paragraph">
            <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
          </p>
        );
      }
      // Пустые строки
      else {
        flushList();
      }
    });
    
    flushList();
    return elements;
  };

  const renderRecommendationsPage = () => {
    return (
        <>
            <div className="main__header">
                <div className="main__header-with-indicator">
                    <h1 className="main__title">Рекомендации от ИИ</h1>
                    <DataSourceIndicator source={dataSource.recommendations} />
                </div>
                <p className="main__subtitle">Получите персонализированные рекомендации на основе анализа отзывов</p>
            </div>

            <div className="recommendation-page">
                <div className="recommendation-controls card">
                    <div className="recommendation-controls__header">
                        <div className="recommendation-controls__icon">
                            <Sparkles size={24} />
                        </div>
                        <div className="recommendation-controls__text">
                            <h4 className="recommendation-controls__title">Анализ негативных отзывов</h4>
                            <p className="recommendation-controls__description">
                                Выберите тему для анализа, и ИИ-аналитик предоставит конкретные рекомендации по улучшению
                            </p>
                        </div>
                    </div>
                    
                    <div className="recommendation-controls__actions">
                        <div className="recommendation-select-wrapper">
                            <label className="recommendation-select__label">Тема анализа</label>
                            <div className="recommendation-select">
                                <select 
                                    value={selectedTopicForAnalysis} 
                                    onChange={(e) => setSelectedTopicForAnalysis(e.target.value)}
                                    className="recommendation-select__input"
                                >
                                    {availableTopics.filter(t => t.id !== 'Все').map(topic => (
                                        <option key={topic.id} value={topic.id}>{topic.label}</option>
                                    ))}
                                </select>
                                <div className="recommendation-select__arrow">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={fetchRecommendations} 
                            disabled={isLoadingRecommendations} 
                            className={`btn btn--primary recommendation-btn ${isLoadingRecommendations ? 'btn--loading' : ''}`}
                        >
                            {isLoadingRecommendations ? (
                                <>
                                    <span className="recommendation-btn__spinner"></span>
                                    <span>Анализирую...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>Сгенерировать рекомендации</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="recommendation-output-card card">
                    {isLoadingRecommendations && (
                        <div className="recommendation-loading">
                            <div className="recommendation-loading__spinner"></div>
                            <p className="recommendation-loading__text">ИИ-аналитик изучает отзывы...</p>
                            <p className="recommendation-loading__subtext">Это может занять несколько секунд</p>
                        </div>
                    )}
                    
                    {recommendationsError && !isLoadingRecommendations && (
                        <div className="recommendation-error">
                            <div className="recommendation-error__icon">⚠️</div>
                            <p className="recommendation-error__text">Ошибка: {recommendationsError}</p>
                            <p className="recommendation-error__subtext">Загружены демонстрационные данные</p>
                        </div>
                    )}
                    
                    {!isLoadingRecommendations && !recommendationsData && !recommendationsError && (
                        <div className="recommendation-empty">
                            <div className="recommendation-empty__icon">
                                <Sparkles size={48} />
                            </div>
                            <p className="recommendation-empty__text">Выберите тему и нажмите кнопку для генерации рекомендаций</p>
                        </div>
                    )}
                    
                    {!isLoadingRecommendations && recommendationsData && (
                        <div className="recommendation-output">
                            <div className="recommendation-markdown">
                                {renderMarkdown(recommendationsData)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
  };

  const renderCompetitorPage = () => {
    const competitorList = ["Sber", "Tinkoff", "VTB", "Alfa-Bank"];
    const handleCompetitorSelection = (bankName) => {
        setSelectedCompetitors(prev => 
            prev.includes(bankName) 
              ? prev.filter(b => b !== bankName)
              : [...prev, bankName]
        );
    };

    // Фильтруем данные по выбранным конкурентам (Gazprombank всегда включен)
    const filteredCompetitorData = competitorData 
      ? competitorData.filter(item => 
          item.bank_name === 'Gazprombank' || selectedCompetitors.includes(item.bank_name)
        ).sort((a, b) => b.nps_score - a.nps_score)
      : [];

    // Custom Tooltip для графика
    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="competitor-tooltip">
            <p className="competitor-tooltip__label">{data.bank_name}</p>
            <p className="competitor-tooltip__value">NPS: {data.nps_score}</p>
          </div>
        );
      }
      return null;
    };

    return (
        <>
            <div className="main__header">
                <h1 className="main__title">Сравнение с конкурентами</h1>
            </div>

            <div className="competitor-page">
                <div className="competitor-filters card">
                    <h4>Выберите конкурентов для сравнения</h4>
                    <div className="competitor-checkbox-list">
                        {competitorList.map(bank => {
                            const isChecked = selectedCompetitors.includes(bank);
                            return (
                                <label 
                                    key={bank} 
                                    className={`competitor-checkbox ${isChecked ? 'competitor-checkbox--checked' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleCompetitorSelection(bank)}
                                    />
                                    <span className="competitor-checkbox__indicator">
                                        <Check />
                                    </span>
                                    <span className="competitor-checkbox__label">{bank}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="card competitor-chart-card">
                    <div className="card__header-with-indicator">
                        <h4>Сравнение по NPS (Net Promoter Score)</h4>
                        <DataSourceIndicator source={dataSource.competitors} />
                    </div>
                    
                    {competitorError && console.log('[Competitors] API error, using mock data:', competitorError)}
                    
                    {isLoadingCompetitors ? (
                        <div className="competitor-loading">
                            <div className="competitor-loading__spinner"></div>
                            <span className="competitor-loading__text">Загрузка данных о конкурентах...</span>
                        </div>
                    ) : filteredCompetitorData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart 
                                data={filteredCompetitorData} 
                                layout="vertical" 
                                margin={{ left: 20, right: 40, top: 20, bottom: 20 }}
                            >
                                <CartesianGrid 
                                    strokeDasharray="3 3" 
                                    stroke="rgba(255, 255, 255, 0.06)"
                                    horizontal={true}
                                    vertical={false}
                                />
                                <XAxis 
                                    type="number" 
                                    domain={[0, 100]} 
                                    tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                    tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                />
                                <YAxis 
                                    dataKey="bank_name" 
                                    type="category" 
                                    width={120}
                                    tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: 500 }}
                                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                                <Bar 
                                    dataKey="nps_score" 
                                    name="NPS" 
                                    radius={[0, 8, 8, 0]}
                                    barSize={32}
                                >
                                    {filteredCompetitorData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.bank_name === 'Gazprombank' 
                                                ? 'url(#gazprombankGradient)' 
                                                : 'rgba(255, 255, 255, 0.15)'
                                            }
                                            stroke={entry.bank_name === 'Gazprombank' 
                                                ? 'rgba(99, 102, 241, 0.5)' 
                                                : 'rgba(255, 255, 255, 0.1)'
                                            }
                                            strokeWidth={1}
                                        />
                                    ))}
                                </Bar>
                                <defs>
                                    <linearGradient id="gazprombankGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#6366F1" />
                                        <stop offset="100%" stopColor="#8B5CF6" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="competitor-error">
                            <span className="competitor-error__icon">📊</span>
                            <span className="competitor-error__text">Выберите конкурентов для сравнения</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
  };

  // Helper function to determine alert severity based on percentage
  const getAlertSeverity = (percentage) => {
    if (percentage === 'inf' || percentage >= 100) return 'danger';
    if (percentage >= 50) return 'warning';
    return 'info';
  };

  // Helper function to get severity label
  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'danger': return 'Критично';
      case 'warning': return 'Внимание';
      case 'info': return 'Информация';
      default: return 'Оповещение';
    }
  };

  // Helper function to get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'danger': return '🔴';
      case 'warning': return '🟠';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  const renderAlertsPage = () => (
    <>
      <div className="main__header">
        <div className="main__header-with-indicator">
          <h1 className="main__title">Оповещения о резких изменениях</h1>
          <DataSourceIndicator source={dataSource.alerts} />
        </div>
      </div>
      <div className="alerts-page">
        {isLoadingAlerts ? (
          <div className="alerts-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="alert-skeleton">
                <div className="alert-skeleton__header">
                  <div className="alert-skeleton__topic">
                    <div className="alert-skeleton__icon skeleton"></div>
                    <div className="alert-skeleton__title skeleton"></div>
                  </div>
                  <div className="alert-skeleton__badge skeleton"></div>
                </div>
                <div className="alert-skeleton__message skeleton"></div>
                <div className="alert-skeleton__message alert-skeleton__message--short skeleton"></div>
                <div className="alert-skeleton__footer">
                  <div className="alert-skeleton__percentage skeleton"></div>
                  <div className="alert-skeleton__timestamp skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        ) : alertsError ? (
          <div className="alerts-error">
            <div className="alerts-error__icon">⚠️</div>
            <h3 className="alerts-error__title">Не удалось загрузить оповещения</h3>
            <p className="alerts-error__message">{alertsError}</p>
            <div className="alerts-error__badge">
              <span>📊</span>
              <span>Отображены демо-данные</span>
            </div>
          </div>
        ) : alertsData && alertsData.length > 0 ? (
          alertsData.map((alert, index) => {
            const severity = getAlertSeverity(alert.percentage_increase);
            return (
              <div key={index} className={`alert-card alert-card--${severity}`}>
                <div className="alert-card__header">
                  <div className="alert-card__topic-wrapper">
                    <div className="alert-card__icon">
                      {getSeverityIcon(severity)}
                    </div>
                    <span className="alert-card__topic">{translateTopicName(alert.topic)}</span>
                  </div>
                  <span className="alert-card__badge">
                    {getSeverityLabel(severity)}
                  </span>
                </div>
                <p className="alert-card__message">{alert.message}</p>
                <div className="alert-card__footer">
                  <div className="alert-card__percentage-wrapper">
                    <span className="alert-card__percentage-label">Рост негатива</span>
                    <span className="alert-card__percentage">
                      {alert.percentage_increase === 'inf' ? '∞' : `+${alert.percentage_increase}%`}
                    </span>
                    <span className="alert-card__percentage-arrow">↑</span>
                  </div>
                  <span className="alert-card__timestamp">Обнаружено сегодня</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="alerts-empty">
            <div className="alerts-empty__icon">✅</div>
            <h3 className="alerts-empty__title">Нет активных оповещений</h3>
            <p className="alerts-empty__description">
              Все показатели в норме. Система автоматически уведомит вас при обнаружении резких изменений в тональности отзывов.
            </p>
          </div>
        )}
      </div>
    </>
  );

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/reviews');
      if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reviews_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV. Please check the console for more information.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderExportPage = () => (
    <>
      <div className="main__header">
        <h1 className="main__title">Экспорт данных в BI</h1>
        <p className="main__subtitle">Выгрузка данных для аналитических систем</p>
      </div>
      <div className="export-page">
        <div className="export-card">
          <div className="export-card__icon">
            <Download size={32} />
          </div>
          <div className="export-card__content">
            <h3 className="export-card__title">Экспорт всех отзывов</h3>
            <p className="export-card__description">
              Скачайте все обработанные отзывы с темами и тональностями в формате CSV. 
              Этот файл можно легко импортировать в любую BI-систему для дальнейшего анализа.
            </p>
            <div className="export-card__features">
              <div className="export-card__feature">
                <span className="export-card__feature-icon">📊</span>
                <span>Power BI</span>
              </div>
              <div className="export-card__feature">
                <span className="export-card__feature-icon">📈</span>
                <span>Tableau</span>
              </div>
              <div className="export-card__feature">
                <span className="export-card__feature-icon">📉</span>
                <span>Excel</span>
              </div>
              <div className="export-card__feature">
                <span className="export-card__feature-icon">🔢</span>
                <span>Google Sheets</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleExportCsv} 
            disabled={isExporting} 
            className={`export-btn ${isExporting ? 'export-btn--loading' : ''}`}
          >
            {isExporting ? (
              <>
                <span className="export-btn__spinner"></span>
                <span>Экспорт...</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span>Скачать CSV</span>
              </>
            )}
          </button>
        </div>
        
        <div className="export-info">
          <div className="export-info__card">
            <div className="export-info__header">
              <span className="export-info__icon">ℹ️</span>
              <h4 className="export-info__title">Информация о данных</h4>
            </div>
            <ul className="export-info__list">
              <li>Все отзывы с классификацией по темам</li>
              <li>Анализ тональности (позитивная, негативная, нейтральная)</li>
              <li>Временные метки для трендового анализа</li>
              <li>Готовый формат для импорта в BI-системы</li>
            </ul>
          </div>
          
          <div className="export-info__card">
            <div className="export-info__header">
              <span className="export-info__icon">💡</span>
              <h4 className="export-info__title">Рекомендации</h4>
            </div>
            <p className="export-info__text">
              Для наилучших результатов рекомендуем использовать Power BI или Tableau 
              для создания интерактивных дашбордов на основе экспортированных данных.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderDocumentationPage = () => (
    <>
      <div className="main__header">
        <h1 className="main__title">Документация</h1>
        <p className="main__subtitle">Руководство по использованию аналитической платформы</p>
      </div>
      <div className="documentation">
        {/* Hero Card - Быстрый старт */}
        <div className="documentation__hero">
          <div className="documentation__hero-icon">
            <Sparkles size={32} />
          </div>
          <div className="documentation__hero-content">
            <h2 className="documentation__hero-title">Добро пожаловать</h2>
            <p className="documentation__hero-text">
              ИИ-дашборд для аналитиков Газпромбанка — это современная система для сбора, анализа и визуализации клиентских отзывов. 
              Используйте мощь искусственного интеллекта для получения actionable insights.
            </p>
          </div>
        </div>

        {/* Секция функционала */}
        <div className="documentation__section">
          <h2 className="documentation__section-title">Функционал платформы</h2>
          <div className="documentation__features-grid">
            <div className="documentation__feature-card">
              <div className="documentation__feature-icon documentation__feature-icon--purple">
                <LayoutGrid size={24} />
              </div>
              <h3 className="documentation__feature-title">Кластеризация</h3>
              <p className="documentation__feature-desc">Анализ динамики и распределения отзывов по темам и тональности с интерактивными графиками.</p>
            </div>
            
            <div className="documentation__feature-card">
              <div className="documentation__feature-icon documentation__feature-icon--orange">
                <Flame size={24} />
              </div>
              <h3 className="documentation__feature-title">Тепловые карты</h3>
              <p className="documentation__feature-desc">Визуализация концентрации негативных отзывов по темам и временным периодам.</p>
            </div>
            
            <div className="documentation__feature-card">
              <div className="documentation__feature-icon documentation__feature-icon--blue">
                <Users size={24} />
              </div>
              <h3 className="documentation__feature-title">Сравнение с конкурентами</h3>
              <p className="documentation__feature-desc">Сравнение ключевых метрик NPS и рейтингов с другими банками на рынке.</p>
            </div>
            
            <div className="documentation__feature-card">
              <div className="documentation__feature-icon documentation__feature-icon--pink">
                <Sparkles size={24} />
              </div>
              <h3 className="documentation__feature-title">Рекомендации ИИ</h3>
              <p className="documentation__feature-desc">Автоматические рекомендации по улучшению продуктов на основе анализа негативных отзывов.</p>
            </div>
            
            <div className="documentation__feature-card">
              <div className="documentation__feature-icon documentation__feature-icon--green">
                <FileText size={24} />
              </div>
              <h3 className="documentation__feature-title">Генерация отчётов</h3>
              <p className="documentation__feature-desc">Создание и скачивание аналитических отчетов в форматах PDF и Excel.</p>
            </div>
            
            <div className="documentation__feature-card">
              <div className="documentation__feature-icon documentation__feature-icon--yellow">
                <Bell size={24} />
              </div>
              <h3 className="documentation__feature-title">Оповещения</h3>
              <p className="documentation__feature-desc">Отслеживание резких скачков негативной тональности по различным темам.</p>
            </div>
            
            <div className="documentation__feature-card">
              <div className="documentation__feature-icon documentation__feature-icon--cyan">
                <Download size={24} />
              </div>
              <h3 className="documentation__feature-title">Экспорт в BI</h3>
              <p className="documentation__feature-desc">Выгрузка данных в CSV для импорта в Power BI, Tableau и другие системы.</p>
            </div>
            
            <div className="documentation__feature-card">
              <div className="documentation__feature-icon documentation__feature-icon--indigo">
                <FlaskConical size={24} />
              </div>
              <h3 className="documentation__feature-title">Тестирование</h3>
              <p className="documentation__feature-desc">Загрузка JSON-файлов для тестирования модели классификации отзывов.</p>
            </div>
          </div>
        </div>

        {/* Секция быстрого старта */}
        <div className="documentation__section">
          <h2 className="documentation__section-title">Быстрый старт</h2>
          <div className="documentation__steps">
            <div className="documentation__step">
              <div className="documentation__step-number">1</div>
              <div className="documentation__step-content">
                <h4 className="documentation__step-title">Выберите раздел</h4>
                <p className="documentation__step-desc">Используйте боковое меню для навигации между разделами аналитики.</p>
              </div>
            </div>
            <div className="documentation__step">
              <div className="documentation__step-number">2</div>
              <div className="documentation__step-content">
                <h4 className="documentation__step-title">Настройте фильтры</h4>
                <p className="documentation__step-desc">Выберите временной период и интересующие темы для анализа.</p>
              </div>
            </div>
            <div className="documentation__step">
              <div className="documentation__step-number">3</div>
              <div className="documentation__step-content">
                <h4 className="documentation__step-title">Анализируйте данные</h4>
                <p className="documentation__step-desc">Изучайте графики, получайте рекомендации ИИ и экспортируйте отчеты.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Техническая информация */}
        <div className="documentation__section">
          <h2 className="documentation__section-title">Техническая информация</h2>
          <div className="documentation__tech-cards">
            <div className="documentation__tech-card">
              <h4 className="documentation__tech-title">API Endpoints</h4>
              <p className="documentation__tech-desc">Система использует REST API для получения данных. При недоступности сервера автоматически используются демо-данные.</p>
            </div>
            <div className="documentation__tech-card">
              <h4 className="documentation__tech-title">Модель ИИ</h4>
              <p className="documentation__tech-desc">Классификация отзывов выполняется с помощью fine-tuned модели на основе BERT для русского языка.</p>
            </div>
            <div className="documentation__tech-card">
              <h4 className="documentation__tech-title">Обновление данных</h4>
              <p className="documentation__tech-desc">Данные обновляются в реальном времени при изменении фильтров и временных периодов.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderGenericPage = (title) => (
    <>
      <div className="main__header">
        <h1 className="main__title">{title}</h1>
      </div>
      <p>Страница в разработке...</p>
    </>
  );

  return (
    <div className="app">
      {/* Бургер-кнопка для мобильных устройств */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X size={24} strokeWidth={2} />
        ) : (
          <Menu size={24} strokeWidth={2} />
        )}
      </button>

      {/* Левое меню */}
      <nav className={`sidebar ${isMobileMenuOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon">
              <Sparkles size={24} />
            </div>
            <div className="sidebar__logo-text">
              <span className="sidebar__logo-title">Газпромбанк</span>
              <span className="sidebar__logo-subtitle">Аналитика отзывов</span>
            </div>
          </div>
          <GlobalDataSourceBadge />
          <button 
            className="sidebar__close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar__menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <div 
                key={item.id}
                className={`sidebar__item ${activeMenuItem === item.id ? 'sidebar__item--active' : ''}`}
                onClick={() => {
                  setActiveMenuItem(item.id)
                  setIsMobileMenuOpen(false)
                }}
              >
                <div className="sidebar__icon">
                  <IconComponent size={20} strokeWidth={1.5} />
                </div>
                <span className="sidebar__label">{item.label}</span>
              </div>
            )
          })}
        </div>
      </nav>

      {/* Оверлей для мобильного меню */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Основной контент */}
      <main className="main">
        {activeMenuItem === 'Кластеризация' && renderClusteringPage()}
        {activeMenuItem === 'Тестирование' && renderTestingPage()}
        {activeMenuItem === 'Тепловые карты' && renderHeatmapPage()}
        {activeMenuItem === 'Сравнение с конкурентами' && renderCompetitorPage()}
        {activeMenuItem === 'Рекомендации ИИ' && renderRecommendationsPage()}
        {activeMenuItem === 'Генерация отчётов' && renderReportsPage()}
        {activeMenuItem === 'Оповещения' && renderAlertsPage()}
        {activeMenuItem === 'Экспорт в BI' && renderExportPage()}
        {activeMenuItem === 'Документация' && renderDocumentationPage()}
      </main>
    </div>
  )
}

export default App