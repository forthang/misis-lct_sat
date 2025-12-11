# Design Document: Frontend Redesign

## Overview

Редизайн аналитического дашборда Газпромбанка с фокусом на современный минималистичный дизайн уровня Awwwards. Используется темная тема с glassmorphism эффектами, плавными анимациями и премиальным внешним видом. Все существующие функции сохраняются, добавляется улучшенный UX и mock-данные для демонстрации.

## Architecture

### Структура компонентов

```
src/
├── App.jsx                 # Главный компонент с роутингом
├── App.css                 # Глобальные стили (полностью переписан)
├── index.css               # CSS переменные и reset
├── components/
│   ├── Layout/
│   │   ├── Sidebar.jsx     # Боковая навигация
│   │   └── Header.jsx      # Заголовок страницы
│   ├── Charts/
│   │   ├── LineChart.jsx   # Линейный график
│   │   ├── PieChart.jsx    # Круговая диаграмма
│   │   └── Heatmap.jsx     # Тепловая карта
│   ├── UI/
│   │   ├── Card.jsx        # Glassmorphism карточка
│   │   ├── Button.jsx      # Кнопки
│   │   ├── TopicCard.jsx   # Карточка темы
│   │   └── Skeleton.jsx    # Skeleton loader
│   └── Pages/
│       ├── Clustering.jsx
│       ├── Heatmap.jsx
│       ├── Competitors.jsx
│       ├── Recommendations.jsx
│       ├── Reports.jsx
│       ├── Alerts.jsx
│       ├── Testing.jsx
│       ├── Export.jsx
│       └── Documentation.jsx
└── hooks/
    ├── useApi.js           # Хук для API запросов
    └── useMockData.js      # Хук для mock данных
```

### Дизайн-система

#### Цветовая палитра

```css
/* Основные цвета */
--bg-primary: #0A0A0B;        /* Основной фон */
--bg-secondary: #111113;      /* Вторичный фон */
--bg-tertiary: #1A1A1D;       /* Третичный фон */
--bg-card: rgba(255, 255, 255, 0.03);  /* Фон карточек */

/* Акцентные цвета */
--accent-primary: #6366F1;    /* Основной акцент (индиго) */
--accent-secondary: #8B5CF6;  /* Вторичный акцент (фиолетовый) */
--accent-gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);

/* Текст */
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.4);

/* Семантические цвета */
--success: #10B981;
--warning: #F59E0B;
--danger: #EF4444;
--info: #3B82F6;

/* Границы */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.1);
```

#### Типографика

```css
/* Шрифт */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Размеры */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* Веса */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Отступы и размеры

```css
/* Spacing (8px grid) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */

/* Border radius */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

## Components and Interfaces

### Sidebar Component

```jsx
// Структура навигации
const menuItems = [
  { id: 'clustering', label: 'Кластеризация', icon: 'LayoutGrid' },
  { id: 'heatmap', label: 'Тепловые карты', icon: 'Flame' },
  { id: 'competitors', label: 'Конкуренты', icon: 'Users' },
  { id: 'recommendations', label: 'Рекомендации ИИ', icon: 'Sparkles' },
  { id: 'testing', label: 'Тестирование', icon: 'FlaskConical' },
  { id: 'reports', label: 'Отчёты', icon: 'FileText' },
  { id: 'alerts', label: 'Оповещения', icon: 'Bell' },
  { id: 'export', label: 'Экспорт в BI', icon: 'Download' },
  { id: 'docs', label: 'Документация', icon: 'BookOpen' }
]
```

### Card Component (Glassmorphism)

```css
.card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}
```

### Topic Card Component

```css
.topic-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.topic-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.topic-card--active {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}
```

### Button Component

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
}

.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
}

.btn--secondary {
  background: rgba(255, 255, 255, 0.06);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Skeleton Loader

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0.03) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 8px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Data Models

### API Response Types

```typescript
interface DashboardData {
  status: string;
  data: {
    overview: {
      total_reviews: number;
      popular_topics: Array<{
        topic: string;
        count: number;
      }>;
    };
    topic_trends: Array<{
      period: string;
      topic: string;
      count: number;
    }>;
  };
}

interface SentimentData {
  status: string;
  data: Array<{
    topic: string;
    sentiment_breakdown: {
      'положительно': number;
      'нейтрально': number;
      'отрицательно': number;
    };
  }>;
}

interface AlertData {
  topic: string;
  message: string;
  percentage_increase: number | 'inf';
}
```

### Mock Data Structure

```javascript
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
        { topic: 'transfers', count: 521 }
      ]
    },
    topic_trends: [
      { period: '2024-01', topic: 'creditcards', count: 120 },
      { period: '2024-02', topic: 'creditcards', count: 145 },
      // ... more data
    ]
  }
};

const mockCompetitorData = [
  { bank_name: 'Gazprombank', nps_score: 42 },
  { bank_name: 'Sber', nps_score: 56 },
  { bank_name: 'Tinkoff', nps_score: 68 },
  { bank_name: 'VTB', nps_score: 35 },
  { bank_name: 'Alfa-Bank', nps_score: 48 }
];

const mockAlerts = [
  {
    topic: 'mobile_app',
    message: 'Резкий рост негативных отзывов о мобильном приложении',
    percentage_increase: 156
  },
  {
    topic: 'creditcards',
    message: 'Увеличение жалоб на условия кредитных карт',
    percentage_increase: 89
  }
];
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following properties can be verified through property-based testing:

### Property 1: Spacing System Consistency
*For any* spacing CSS variable in the design system, the value SHALL be a multiple of 4px (following the 8px grid with 4px subdivisions).
**Validates: Requirements 1.4**

### Property 2: Menu Items Structure
*For any* menu item in the sidebar, it SHALL contain both an icon component and a text label.
**Validates: Requirements 2.2**

### Property 3: Active Menu State
*For any* menu item click, the clicked item SHALL receive the active class and all other items SHALL lose the active class.
**Validates: Requirements 2.4**

### Property 4: Topic Selection Updates Charts
*For any* topic selection change, the dashboard SHALL trigger data fetch functions for the selected topic.
**Validates: Requirements 3.2**

### Property 5: Loading State Shows Skeleton
*For any* loading state (isLoading=true), the component SHALL render a skeleton loader instead of empty content.
**Validates: Requirements 3.5, 14.3**

### Property 6: Time Range Selection Updates Data
*For any* time range selection change, the dashboard SHALL call all relevant fetch functions with the new date parameters.
**Validates: Requirements 4.2, 4.4**

### Property 7: Heatmap Color Scale
*For any* heatmap cell value, the getColor function SHALL return a color from the defined palette based on the value's percentage of the maximum.
**Validates: Requirements 6.4**

### Property 8: Loading Button State
*For any* async operation button, when isLoading is true, the button text SHALL change to indicate loading state.
**Validates: Requirements 7.2, 9.4, 11.2**

### Property 9: Gazprombank Highlight
*For any* competitor chart rendering, the bar for 'Gazprombank' SHALL use the accent color while others use the secondary color.
**Validates: Requirements 8.3**

### Property 10: API Fallback to Mock Data
*For any* API error, the component SHALL fall back to mock data and display an error indicator.
**Validates: Requirements 8.4, 13.2, 13.4**

### Property 11: Alert Card Structure
*For any* alert in the alerts array, the rendered card SHALL display the topic name, message, and percentage increase.
**Validates: Requirements 10.2**

### Property 12: Empty Alerts Message
*For any* empty alerts array, the page SHALL display a "no active alerts" message.
**Validates: Requirements 10.3**

### Property 13: File Upload State Change
*For any* successful file upload, the component state SHALL update to reflect the loaded file.
**Validates: Requirements 11.4**

### Property 14: Touch Target Size
*For any* interactive button element, the minimum dimensions SHALL be at least 44x44 pixels.
**Validates: Requirements 12.4**

### Property 15: Initial Data Fetch
*For any* component mount, the useEffect SHALL trigger API fetch functions.
**Validates: Requirements 13.1**

## Error Handling

### API Error Handling
- All API calls wrapped in try-catch blocks
- Error state stored in component state (e.g., `dashboardError`, `sentimentError`)
- User-friendly error messages displayed in UI
- Automatic fallback to mock data when API fails

### Loading States
- Skeleton loaders shown during data fetching
- Button text changes to indicate processing
- Disabled state for buttons during async operations

### Input Validation
- File type validation for JSON uploads
- Date range validation for custom date picker
- Empty state handling for all data displays

## Testing Strategy

### Dual Testing Approach

#### Unit Tests
- Test individual utility functions (translateTopicName, getDateRangeAndMode, formatXAxisLabel)
- Test data transformation functions (getTopicsData, getCurrentData)
- Test color calculation functions (getColor for heatmap)

#### Property-Based Tests
Using **fast-check** library for JavaScript property-based testing:

1. **Spacing System Test**: Generate random spacing variable names and verify values are multiples of 4
2. **Menu State Test**: Generate random menu item clicks and verify only one item is active
3. **API Fallback Test**: Simulate API errors and verify mock data is used
4. **Color Scale Test**: Generate random values and verify color output is within palette

### Test Configuration
- Minimum 100 iterations per property test
- Tests tagged with property reference: `**Feature: frontend-redesign, Property {N}: {description}**`

### Test File Structure
```
frontend/
├── src/
│   └── __tests__/
│       ├── utils.test.js           # Unit tests for utility functions
│       ├── components.test.js      # Component unit tests
│       └── properties.test.js      # Property-based tests
```
