import React, { useState, useEffect } from 'react'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'

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
        throw new Error(`HTTP error! status: ${response.status}`)
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
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
      setTopicsError(error.message)
      
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Dashboard API response:', data)
      console.log('Dashboard API response keys:', Object.keys(data))
      if (data.data && data.data.overview && data.data.overview.popular_topics) {
        console.log('popular_topics found in data.overview:', data.data.overview.popular_topics)
      } else {
        console.log('popular_topics NOT found in expected location')
        console.log('Available keys:', Object.keys(data))
        if (data.data) {
          console.log('data keys:', Object.keys(data.data))
          if (data.data.overview) {
            console.log('overview keys:', Object.keys(data.data.overview))
          }
        }
      }
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardError(error.message)
    } finally {
      setIsLoadingDashboard(false)
    }
  }

  // Функция для загрузки данных тональности
  const fetchSentimentData = async (topicId) => {
    if (topicId === 'Все') {
      setSentimentData(null)
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Sentiment API response:', data)
      setSentimentData(data)
    } catch (error) {
      console.error('Error fetching sentiment data:', error)
      setSentimentError(error.message)
    } finally {
      setIsLoadingSentiment(false)
    }
  }

  // Функция для загрузки данных статистики по темам
  const fetchTopicsStatisticsData = async (topicId) => {
    if (topicId === 'Все') {
      setTopicsStatisticsData(null)
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Topics Statistics API response:', data)
      setTopicsStatisticsData(data)
    } catch (error) {
      console.error('Error fetching topics statistics data:', error)
      setTopicsStatisticsError(error.message)
    } finally {
      setIsLoadingTopicsStatistics(false)
    }
  }

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
          mode: dateRangeAndMode.mode, // mode is not strictly needed by endpoint, but good to pass
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === 'success') {
        setHeatmapData(data.data);
      } else {
        throw new Error('Invalid response format for heatmap');
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      setHeatmapError(error.message);
      // Mock data as per user request
      const mockData = [
        { period: '2024-01', topic: 'Ипотека', count: 5 },
        { period: '2024-02', topic: 'Ипотека', count: 8 },
        { period: '2024-01', topic: 'Кредитные карты', count: 12 },
        { period: '2024-03', topic: 'Кредитные карты', count: 15 },
        { period: '2024-02', topic: 'Автокредиты', count: 7 },
        { period: '2024-03', topic: 'Автокредиты', count: 4 },
        { period: '2024-04', topic: 'Дебетовые карты', count: 22 },
        { period: '2024-05', topic: 'Дебетовые карты', count: 18 },
      ];
      setHeatmapData(mockData);
    } finally {
      setIsLoadingHeatmap(false);
    }
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
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === 'success') {
        setRecommendationsData(data.data);
      } else {
        throw new Error(data.detail || 'Invalid response format for recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendationsError(error.message);
      setRecommendationsData(
`### Рекомендации по улучшению продукта/услуги: Ипотека

**1. Проблема: Длительное рассмотрение ипотечных заявок.**
    *   **Рекомендация 1:** Внедрить систему скоринга на основе ИИ для автоматической проверки базовых критериев заемщика, что сократит время предварительного одобрения до 15 минут.
    *   **Рекомендация 2:** Создать в мобильном приложении "трекер заявки", который будет наглядно показывать клиенту, на каком этапе находится его обращение (проверка документов, оценка недвижимости, финальное одобрение).

**2. Проблема: Клиенты жалуются на некомпетентность менеджеров по ипотеке.**
    *   **Рекомендация 1:** Организовать ежеквартальные обязательные тренинги и аттестацию для ипотечных специалистов по последним изменениям в законодательстве и внутренних программах банка.
    *   **Рекомендация 2:** Разработать и внедрить единую базу знаний (wiki) по ипотечным продуктам, доступную всем сотрудникам, для быстрого поиска ответов на сложные вопросы клиентов.

**3. Проблема: Непрозрачные условия страхования, навязывание дополнительных услуг.**
    *   **Рекомендация 1:** Предоставлять клиенту на выбор список из как минимум 3-5 аккредитованных страховых компаний с четким указанием стоимости полиса в каждой.
    *   **Рекомендация 2:** Разработать интерактивный калькулятор на сайте, который будет наглядно показывать, как меняется ежемесячный платеж и общая переплата при отказе от тех или иных "добровольных" страховок.
`);
    } finally {
      setIsLoadingRecommendations(false);
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
    'Кластеризация',
    'Тепловые карты',
    'Сравнение с конкурентами',
    'Рекомендации ИИ',
    'Тестирование',
    'Генерация отчётов',
    'Оповещения',
    'Экспорт в BI',
    'Документация',
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
            ) : (selectedClass === 'Все' ? dashboardError : sentimentError) ? (
              <div className="pie-chart__error">
                <div className="pie-chart__error-icon">⚠️</div>
                <span className="pie-chart__error-text">
                  Ошибка загрузки данных: {selectedClass === 'Все' ? dashboardError : sentimentError}. Используются fallback данные.
                </span>
              </div>
            ) : (
              <>
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
        <h1 className="main__title">Кластеризация</h1>
      </div>

      {/* Карточки выбора класса */}
      <div className="class-cards">
        <div className="class-cards__container">
          {isLoadingTopics ? (
            <div className="class-cards__loading">
              <div className="class-cards__loading-spinner"></div>
              <span className="class-cards__loading-text">Загрузка тем...</span>
            </div>
          ) : topicsError ? (
            <div className="class-cards__error">
              <div className="class-cards__error-icon">⚠️</div>
              <span className="class-cards__error-text">
                Ошибка загрузки тем: {topicsError}. Используются fallback данные.
              </span>
            </div>
          ) : null}
          
          {classCards.map((classCard) => (
            <div
              key={classCard.id}
              className={`class-card ${selectedClass === classCard.id ? 'class-card--active' : ''}`}
              data-class={classCard.id}
              onClick={() => setSelectedClass(classCard.id)}
              style={{
                borderColor: selectedClass === classCard.id ? classCard.color : (classCard.id === 'Все' ? '#c5d9f1' : 'transparent'),
                backgroundColor: selectedClass === classCard.id ? `${classCard.color}10` : (classCard.id === 'Все' ? 'linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)' : '#ffffff')
              }}
            >
              <div 
                className="class-card__indicator"
                style={{ backgroundColor: classCard.color }}
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
          
          {/* Поля для выбора дат */}
          <div className="custom-date-range" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '20px' }}>
            <div className="custom-date-range__field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="custom-date-range__label" style={{ fontSize: '14px', fontWeight: '500' }}>От:</label>
              <input
                type="date"
                className="custom-date-range__input"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  startDate: e.target.value
                }))}
                style={{ 
                  padding: '4px 6px', 
                  border: 'none', 
                  borderBottom: '1px solid #ccc',
                  backgroundColor: 'transparent',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div className="custom-date-range__field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="custom-date-range__label" style={{ fontSize: '14px', fontWeight: '500' }}>До:</label>
              <input
                type="date"
                className="custom-date-range__input"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
                style={{ 
                  padding: '4px 6px', 
                  border: 'none', 
                  borderBottom: '1px solid #ccc',
                  backgroundColor: 'transparent',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <button
              onClick={() => {
                setSelectedTimeRange('custom')
                fetchDashboardData()
                fetchSentimentData(selectedClass)
                fetchTopicsStatisticsData(selectedClass)
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#2b61ec',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginLeft: '8px'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1e4bb8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2b61ec'}
            >
              Обновить
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
                    stroke={classCards.find(c => c.id === selectedClass)?.color || '#2b61ec'} 
                    strokeWidth={3}
                    dot={{ fill: classCards.find(c => c.id === selectedClass)?.color || '#2b61ec', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: classCards.find(c => c.id === selectedClass)?.color || '#2b61ec', strokeWidth: 2 }}
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
                    `${value}% (${props.payload.count || props.payload.value} отзывов)`,
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
  const renderTestingPage = () => (
    <>
      <div className="main__header">
        <h1 className="main__title">Тестирование</h1>
      </div>

      {/* Панель загрузки и метрик */}
      <div className="testing-panel">
        <div className="testing-panel__container">

          {/* Загрузка файла */}
          <div className="file-upload-section">
            <h3 className="file-upload-section__title">Загрузить данные для тестирования</h3>
            <div className="file-upload">
              <input
                type="file"
                id="json-upload"
                accept=".json"
                onChange={handleFileUpload}
                className="file-upload__input"
              />
              <label htmlFor="json-upload" className="file-upload__label">
                <span className="file-upload__icon">📁</span>
                <span className="file-upload__text">
                  {isLoadingPredictions 
                    ? 'Обработка...' 
                    : testingData 
                      ? 'Файл загружен' 
                      : 'Выберите JSON файл'}
                </span>
              </label>
            </div>
          </div>

          {/* Отображение ошибки */}
          {predictionsError && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '4px',
              margin: '16px 0',
              border: '1px solid #f5c6cb'
            }}>
              <strong>Ошибка при обработке файла:</strong> {predictionsError}
            </div>
          )}

          {/* Скачивание файла */}
          <div className="download-section">
            <h3 className="download-section__title">Экспорт результатов</h3>
            <button
              className="download-button"
              onClick={handleDownloadJson}
              disabled={!testingData && !predictionsResponse}
            >
              <span className="download-button__icon">💾</span>
              <span className="download-button__text">
                {predictionsResponse ? 'Скачать answers.json' : 'Скачать JSON'}
              </span>
            </button>
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
          {isLoadingHeatmap ? (
            <div className="pie-chart__loading">
              <div className="pie-chart__loading-spinner"></div>
              <span className="pie-chart__loading-text">Загрузка данных для карты...</span>
            </div>
          ) : heatmapError ? (
            <div className="pie-chart__error">
              <div className="pie-chart__error-icon">⚠️</div>
              <span className="pie-chart__error-text">Ошибка: {heatmapError} (загружены mock данные)</span>
            </div>
          ) : null}
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
      <>
        <div className="main__header">
          <h1 className="main__title">Генерация отчётов</h1>
        </div>
        <div className="card" style={{ maxWidth: '800px' }}>
          <div className="report-generator">
            <div className="report-section">
              <h4>1. Выберите временной диапазон</h4>
                <div className="time-range-selector" style={{margin: 0, padding: 0}}>
                  <div className="time-range-selector__options" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                    {timeRangeOptions.map((option) => (
                      <label key={option.id} className="time-range-option">
                        <input
                          type="radio"
                          name="time-range-report"
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

            <div className="report-section">
              <h4>2. Выберите темы для отчета</h4>
              <div className="topic-selection-list">
                {availableTopics.filter(t => t.id !== 'Все').map(topic => (
                  <label key={topic.id} className="topic-checkbox">
                    <input 
                      type="checkbox"
                      checked={selectedReportTopics.includes(topic.id)}
                      onChange={() => handleTopicSelection(topic.id)}
                    />
                    {topic.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="report-section">
              <h4>3. Выберите формат</h4>
              <div className="format-selection">
                <label className="time-range-option">
                  <input type="radio" value="excel" checked={reportFormat === 'excel'} onChange={(e) => setReportFormat(e.target.value)} />
                  <span className="time-range-option__label">Excel (.xlsx)</span>
                </label>
                <label className="time-range-option">
                  <input type="radio" value="pdf" checked={reportFormat === 'pdf'} onChange={(e) => setReportFormat(e.target.value)} />
                   <span className="time-range-option__label">PDF (.pdf)</span>
                </label>
              </div>
            </div>

            <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="download-button">
              {isGeneratingReport ? 'Генерация...' : 'Сгенерировать отчёт'}
            </button>
          </div>
        </div>
      </>
    );
  };





  const renderRecommendationsPage = () => {
    return (
        <>
            <div className="main__header">
                <h1 className="main__title">Рекомендации от ИИ</h1>
            </div>

            <div className="recommendation-page">
                <div className="recommendation-controls card">
                    <h4>Анализ негативных отзывов</h4>
                    <p>Выберите тему, чтобы получить от ИИ-аналитика конкретные рекомендации по улучшению.</p>
                    <select 
                        value={selectedTopicForAnalysis} 
                        onChange={(e) => setSelectedTopicForAnalysis(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        {availableTopics.filter(t => t.id !== 'Все').map(topic => (
                            <option key={topic.id} value={topic.id}>{topic.label}</option>
                        ))}
                    </select>
                    <button onClick={fetchRecommendations} disabled={isLoadingRecommendations} className="download-button" style={{width: 'auto'}}>
                        {isLoadingRecommendations ? 'Анализ...' : 'Сгенерировать рекомендации'}
                    </button>
                </div>

                <div className="card">
                    {isLoadingRecommendations && <p>ИИ-аналитик изучает отзывы...</p>}
                    {recommendationsError && <p style={{color: 'red'}}>Ошибка: {recommendationsError}</p>}
                    {recommendationsData && (
                        <div className="recommendation-output">
                            <pre>{recommendationsData}</pre>
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

    return (
        <>
            <div className="main__header">
                <h1 className="main__title">Сравнение с конкурентами</h1>
            </div>

            <div className="competitor-page">
                <div className="competitor-filters card">
                    <h4>Выберите конкурентов для сравнения</h4>
                    <div className="topic-selection-list">
                        {competitorList.map(bank => (
                            <label key={bank} className="topic-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedCompetitors.includes(bank)}
                                    onChange={() => handleCompetitorSelection(bank)}
                                />
                                {bank}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h4>Сравнение по NPS (Net Promoter Score)</h4>
                    {isLoadingCompetitors ? (
                        <p>Загрузка данных...</p>
                    ) : competitorError ? (
                        <p>Ошибка: {competitorError} (Загружены mock данные)</p>
                    ) : null}
                    {competitorData && (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={competitorData} layout="vertical" margin={{ left: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[-100, 100]} />
                                <YAxis dataKey="bank_name" type="category" />
                                <Tooltip />
                                <Bar dataKey="nps_score" name="NPS">
                                    {competitorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.bank_name === 'Gazprombank' ? '#2b61ec' : '#64748b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </>
    );
  };

  const renderAlertsPage = () => (
    <>
      <div className="main__header">
        <h1 className="main__title">Оповещения о резких изменениях</h1>
      </div>
      <div className="alerts-page">
        {isLoadingAlerts ? (
          <div className="pie-chart__loading">
            <div className="pie-chart__loading-spinner"></div>
            <span className="pie-chart__loading-text">Загрузка оповещений...</span>
          </div>
        ) : alertsError ? (
           <div className="pie-chart__error">
              <div className="pie-chart__error-icon">⚠️</div>
              <span className="pie-chart__error-text">Ошибка: {alertsError} (загружены mock данные)</span>
            </div>
        ) : alertsData && alertsData.length > 0 ? (
          alertsData.map((alert, index) => (
            <div key={index} className="alert-card alert-card--danger">
              <h4 className="alert-card__title">Резкий рост негатива: {translateTopicName(alert.topic)}</h4>
              <p className="alert-card__message">
                {alert.message} 
                (Рост на <strong>{alert.percentage_increase === 'inf' ? '∞' : `${alert.percentage_increase}%`}</strong>)
              </p>
            </div>
          ))
        ) : (
          <p>Нет активных оповещений.</p>
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
      </div>
      <div className="card" style={{ maxWidth: '600px' }}>
        <h4>Экспорт всех отзывов</h4>
        <p style={{ margin: '16px 0' }}>Нажмите кнопку ниже, чтобы скачать все обработанные отзывы с темами и тональностями в формате CSV. Этот файл можно легко импортировать в любую BI-систему (Power BI, Tableau, etc.) для дальнейшего анализа.</p>
        <button onClick={handleExportCsv} disabled={isExporting} className="download-button">
          {isExporting ? 'Экспорт...' : 'Скачать CSV'}
        </button>
      </div>
    </>
  );

  const renderDocumentationPage = () => (
    <>
      <div className="main__header">
        <h1 className="main__title">Документация</h1>
      </div>
      <div className="documentation">
        <div className="documentation__section">
          <div className="documentation__card">
            <div className="documentation__card-header">
              <div className="documentation__icon">🚀</div>
              <h2 className="documentation__card-title">Быстрый старт</h2>
            </div>
            <div className="documentation__card-content">
              <p>Добро пожаловать в ИИ-дашборд для аналитиков Газпромбанка! Эта система предназначена для сбора, анализа и визуализации клиентских отзывов.</p>
            </div>
          </div>
        </div>
        <div className="documentation__section">
            <h2 className="documentation__section-title">Функционал</h2>
            <div className="documentation__features">
                <div className="documentation__feature"><h3>Кластеризация</h3><p>Анализ динамики и распределения отзывов по темам и тональности.</p></div>
                <div className="documentation__feature"><h3>Тепловые карты</h3><p>Визуализация концентрации негативных отзывов по темам и месяцам.</p></div>
                <div className="documentation__feature"><h3>Сравнение с конкурентами</h3><p>Сравнение ключевых метрик (NPS, средний рейтинг) с другими банками.</p></div>
                <div className="documentation__feature"><h3>Рекомендации ИИ</h3><p>Получение автоматических рекомендаций по улучшению на основе анализа негативных отзывов.</p></div>
                <div className="documentation__feature"><h3>Генерация отчётов</h3><p>Создание и скачивание аналитических отчетов в форматах PDF и Excel.</p></div>
                <div className="documentation__feature"><h3>Оповещения</h3><p>Отслеживание резких скачков негативной тональности по различным темам.</p></div>
                <div className="documentation__feature"><h3>Экспорт в BI</h3><p>Выгрузка всех данных в формате CSV для импорта в Power BI, Tableau и другие системы.</p></div>
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
        <span className={`burger-line ${isMobileMenuOpen ? 'burger-line--active' : ''}`}></span>
        <span className={`burger-line ${isMobileMenuOpen ? 'burger-line--active' : ''}`}></span>
        <span className={`burger-line ${isMobileMenuOpen ? 'burger-line--active' : ''}`}></span>
      </button>

      {/* Левое меню */}
      <nav className={`sidebar ${isMobileMenuOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <h2 className="sidebar__title">Меню</h2>
          <button 
            className="sidebar__close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <div className="sidebar__menu">
          {menuItems.map((item, index) => (
            <div 
              key={index}
              className={`sidebar__item ${activeMenuItem === item ? 'sidebar__item--active' : ''}`}
              onClick={() => {
                setActiveMenuItem(item)
                setIsMobileMenuOpen(false) // Закрываем меню при выборе пункта
              }}
            >
              <div className="sidebar__icon">
                <div className="sidebar__icon-grid">
                  <div className="sidebar__icon-square"></div>
                  <div className="sidebar__icon-square"></div>
                  <div className="sidebar__icon-square"></div>
                  <div className="sidebar__icon-square"></div>
                </div>
              </div>
              <span className="sidebar__label">{item}</span>
            </div>
          ))}
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