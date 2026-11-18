import type { App } from 'vue';

import { createCumquatConfig, cumquatConfigKey } from './config';
import type { CumquatConfig } from './config';

// 通用
import Button from './components/general/Button.vue';
import Icon from './components/general/Icon.vue';
import Typography from './components/general/Typography.vue';
// 布局
import Divider from './components/layout/Divider.vue';
import Grid from './components/layout/Grid.vue';
import Layout from './components/layout/Layout.vue';
import Space from './components/layout/Space.vue';
// 导航
import Anchor from './components/navigation/Anchor.vue';
import BackTop from './components/navigation/BackTop.vue';
import Breadcrumb from './components/navigation/Breadcrumb.vue';
import Dropdown from './components/navigation/Dropdown.vue';
import Menu from './components/navigation/Menu.vue';
import Pagination from './components/navigation/Pagination.vue';
import Steps from './components/navigation/Steps.vue';
import Tabs from './components/navigation/Tabs.vue';
// 数据输入
import AutoComplete from './components/data-entry/AutoComplete.vue';
import Cascader from './components/data-entry/Cascader.vue';
import Checkbox from './components/data-entry/Checkbox.vue';
import ColorPicker from './components/data-entry/ColorPicker.vue';
import DatePicker from './components/data-entry/DatePicker.vue';
import Form from './components/data-entry/Form.vue';
import FormItem from './components/data-entry/FormItem.vue';
import Input from './components/data-entry/Input.vue';
import InputNumber from './components/data-entry/InputNumber.vue';
import Mention from './components/data-entry/Mention.vue';
import Radio from './components/data-entry/Radio.vue';
import RadioGroup from './components/data-entry/RadioGroup.vue';
import Rate from './components/data-entry/Rate.vue';
import Select from './components/data-entry/Select.vue';
import Segmented from './components/data-entry/Segmented.vue';
import Slider from './components/data-entry/Slider.vue';
import Switch from './components/data-entry/Switch.vue';
import TimePicker from './components/data-entry/TimePicker.vue';
import Transfer from './components/data-entry/Transfer.vue';
import TreeSelect from './components/data-entry/TreeSelect.vue';
import Upload from './components/data-entry/Upload.vue';
// 数据展示
import Avatar from './components/data-display/Avatar.vue';
import Badge from './components/data-display/Badge.vue';
import Calendar from './components/data-display/Calendar.vue';
import Card from './components/data-display/Card.vue';
import Carousel from './components/data-display/Carousel.vue';
import Collapse from './components/data-display/Collapse.vue';
import Descriptions from './components/data-display/Descriptions.vue';
import Empty from './components/data-display/Empty.vue';
import Image from './components/data-display/Image.vue';
import List from './components/data-display/List.vue';
import ListItem from './components/data-display/ListItem.vue';
import ListItemMeta from './components/data-display/ListItemMeta.vue';
import Popover from './components/data-display/Popover.vue';
import QRCode from './components/data-display/QRCode.vue';
import Statistic from './components/data-display/Statistic.vue';
import Table from './components/data-display/Table.vue';
import Tag from './components/data-display/Tag.vue';
import Timeline from './components/data-display/Timeline.vue';
import Tooltip from './components/data-display/Tooltip.vue';
import Tree from './components/data-display/Tree.vue';
import VirtualList from './components/data-display/VirtualList.vue';
// 反馈
import Alert from './components/feedback/Alert.vue';
import Dialog from './components/feedback/Dialog.vue';
import Drawer from './components/feedback/Drawer.vue';
import Loading from './components/feedback/Loading.vue';
import Message from './components/feedback/Message.vue';
import MessageContainer from './components/feedback/MessageContainer.vue';
import Notification from './components/feedback/Notification.vue';
import NotificationCenter from './components/feedback/NotificationCenter.vue';
import NotificationContainer from './components/feedback/NotificationContainer.vue';
import Popconfirm from './components/feedback/Popconfirm.vue';
import Progress from './components/feedback/Progress.vue';
import Result from './components/feedback/Result.vue';
import Skeleton from './components/feedback/Skeleton.vue';
// 场景组件
import Chat from './components/scenarios/Chat.vue';
import ChatInput from './components/scenarios/ChatInput.vue';
import VoiceButton from './components/scenarios/VoiceButton.vue';
// 其他
import Affix from './components/other/Affix.vue';
import ConfigProvider from './components/other/ConfigProvider.vue';
import FloatButton from './components/other/FloatButton.vue';
import Tour from './components/other/Tour.vue';
import Watermark from './components/other/Watermark.vue';
// 文档工具
import CodeCard from './components/internal/CodeCard.vue';
import LiveDemo from './components/internal/LiveDemo.vue';

import { registerCell } from './components/data-display/cells';
import { registerField } from './components/data-entry/fields';

/** 组件导出名无前缀，按需导入后直接使用 */
export {
  Button,
  ConfigProvider,
  Icon,
  Input,
  Tooltip,
  Select,
  Form,
  FormItem,
  Message,
  MessageContainer,
  Table,
  Dialog,
  Pagination,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Tabs,
  Drawer,
  Dropdown,
  Popover,
  Popconfirm,
  Card,
  Tag,
  Alert,
  Notification,
  NotificationCenter,
  NotificationContainer,
  Loading,
  Menu,
  DatePicker,
  TimePicker,
  Upload,
  Chat,
  ChatInput,
  VoiceButton,
  InputNumber,
  AutoComplete,
  Breadcrumb,
  Progress,
  Skeleton,
  Cascader,
  Tree,
  TreeSelect,
  Collapse,
  Descriptions,
  List,
  ListItem,
  ListItemMeta,
  Avatar,
  Badge,
  Empty,
  Result,
  Steps,
  Layout,
  Grid,
  Space,
  Divider,
  Slider,
  Rate,
  Transfer,
  Timeline,
  Carousel,
  Image,
  Affix,
  Anchor,
  BackTop,
  Statistic,
  Typography,
  Calendar,
  ColorPicker,
  QRCode,
  Watermark,
  Tour,
  CodeCard,
  Mention,
  Segmented,
  VirtualList,
  FloatButton,
};
export { LiveDemo };
/** 三件套挂载：渲染函数/JSX 中可经 List.Item、List.Item.Meta 访问（SFC 模板请直接使用 ListItem/ListItemMeta） */
(List as unknown as Record<string, unknown>).Item = ListItem;
(ListItem as unknown as Record<string, unknown>).Meta = ListItemMeta;
/** 单元格竞选：注册自定义单元格渲染器（同名替换内建实现） */
export { registerCell };
export type { CellRenderer, CellColumn } from './components/data-display/cells';
/** 表格列与行操作配置 */
export type { TableColumn, TableAction } from './components/data-display/Table.vue';
/** 字段竞选：注册自定义控件渲染器（同名替换内建实现） */
export { registerField };
export type { FieldRenderer, FieldContext } from './components/data-entry/fields';

/** 全量注册映射：组件 → C 前缀 PascalCase 注册名（模板中使用 <c-button> 等） */
const registry: Record<string, unknown> = {
  CButton: Button,
  CConfigProvider: ConfigProvider,
  CIcon: Icon,
  CInput: Input,
  CTooltip: Tooltip,
  CSelect: Select,
  CForm: Form,
  CFormItem: FormItem,
  CMessage: Message,
  CMessageContainer: MessageContainer,
  CTable: Table,
  CDialog: Dialog,
  CPagination: Pagination,
  CCheckbox: Checkbox,
  CRadio: Radio,
  CRadioGroup: RadioGroup,
  CSwitch: Switch,
  CTabs: Tabs,
  CDrawer: Drawer,
  CDropdown: Dropdown,
  CPopover: Popover,
  CPopconfirm: Popconfirm,
  CCard: Card,
  CTag: Tag,
  CAlert: Alert,
  CNotification: Notification,
  CNotificationCenter: NotificationCenter,
  CNotificationContainer: NotificationContainer,
  CLoading: Loading,
  CMenu: Menu,
  CDatePicker: DatePicker,
  CTimePicker: TimePicker,
  CUpload: Upload,
  CChat: Chat,
  CChatInput: ChatInput,
  CVoiceButton: VoiceButton,
  CInputNumber: InputNumber,
  CAutoComplete: AutoComplete,
  CBreadcrumb: Breadcrumb,
  CProgress: Progress,
  CSkeleton: Skeleton,
  CCascader: Cascader,
  CTree: Tree,
  CTreeSelect: TreeSelect,
  CCollapse: Collapse,
  CDescriptions: Descriptions,
  CList: List,
  CListItem: ListItem,
  CListItemMeta: ListItemMeta,
  CAvatar: Avatar,
  CBadge: Badge,
  CEmpty: Empty,
  CResult: Result,
  CSteps: Steps,
  CLayout: Layout,
  CGrid: Grid,
  CSpace: Space,
  CDivider: Divider,
  CSlider: Slider,
  CRate: Rate,
  CTransfer: Transfer,
  CTimeline: Timeline,
  CCarousel: Carousel,
  CImage: Image,
  CAffix: Affix,
  CAnchor: Anchor,
  CBackTop: BackTop,
  CStatistic: Statistic,
  CTypography: Typography,
  CCalendar: Calendar,
  CColorPicker: ColorPicker,
  CQRCode: QRCode,
  CWatermark: Watermark,
  CTour: Tour,
  CCodeCard: CodeCard,
  CMention: Mention,
  CSegmented: Segmented,
  CVirtualList: VirtualList,
  CFloatButton: FloatButton,
};

/**
 * 全量安装入口：支持 app.use(Cumquat) 与 app.use(Cumquat, config)。
 * 保留 install 自引用，兼容将 Cumquat 作为对象插件使用的场景。
 */
const install = (app: App, config: CumquatConfig = {}) => {
  for (const [name, component] of Object.entries(registry)) {
    app.component(name, component as never);
  }
  app.provide(cumquatConfigKey, createCumquatConfig(config));
};

export const Cumquat = Object.assign(install, { install });

export type { CumquatConfig } from './config';
export { useCumquatConfig } from './config';

export default Cumquat;
