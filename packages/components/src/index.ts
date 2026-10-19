import type { App } from 'vue';

import LiveDemo from './components/extras/LiveDemo.vue';

// 基础
import Button from './components/basic/Button.vue';
import Icon from './components/basic/Icon.vue';
import Input from './components/basic/Input.vue';
import Card from './components/basic/Card.vue';
import Divider from './components/basic/Divider.vue';
import Avatar from './components/basic/Avatar.vue';
import Badge from './components/basic/Badge.vue';
import Statistic from './components/basic/Statistic.vue';
import Typography from './components/basic/Typography.vue';
import Tag from './components/basic/Tag.vue';
import Empty from './components/basic/Empty.vue';
// 表单控件
import Select from './components/form-controls/Select.vue';
import Checkbox from './components/form-controls/Checkbox.vue';
import Radio from './components/form-controls/Radio.vue';
import RadioGroup from './components/form-controls/RadioGroup.vue';
import Switch from './components/form-controls/Switch.vue';
import InputNumber from './components/form-controls/InputNumber.vue';
import Rate from './components/form-controls/Rate.vue';
import Segmented from './components/form-controls/Segmented.vue';
import AutoComplete from './components/form-controls/AutoComplete.vue';
import Mention from './components/form-controls/Mention.vue';
import Form from './components/form-controls/Form.vue';
import FormItem from './components/form-controls/FormItem.vue';
import TreeSelect from './components/form-controls/TreeSelect.vue';
import Slider from './components/form-controls/Slider.vue';
// 浮层
import Dialog from './components/overlay/Dialog.vue';
import Drawer from './components/overlay/Drawer.vue';
import Dropdown from './components/overlay/Dropdown.vue';
import Popover from './components/overlay/Popover.vue';
import Popconfirm from './components/overlay/Popconfirm.vue';
import Tooltip from './components/overlay/Tooltip.vue';
// 数据展示
import Table from './components/data-display/Table.vue';
import Pagination from './components/data-display/Pagination.vue';
import Tabs from './components/data-display/Tabs.vue';
import Collapse from './components/data-display/Collapse.vue';
import Tree from './components/data-display/Tree.vue';
import Cascader from './components/data-display/Cascader.vue';
import Timeline from './components/data-display/Timeline.vue';
import Steps from './components/data-display/Steps.vue';
import Descriptions from './components/data-display/Descriptions.vue';
import Carousel from './components/data-display/Carousel.vue';
import Progress from './components/data-display/Progress.vue';
import Image from './components/data-display/Image.vue';
// 反馈
import Message from './components/feedback/Message.vue';
import MessageContainer from './components/feedback/MessageContainer.vue';
import Alert from './components/feedback/Alert.vue';
import Notification from './components/feedback/Notification.vue';
import NotificationContainer from './components/feedback/NotificationContainer.vue';
import Loading from './components/feedback/Loading.vue';
import Skeleton from './components/feedback/Skeleton.vue';
import Result from './components/feedback/Result.vue';
import Upload from './components/feedback/Upload.vue';
import Chat from './components/feedback/Chat.vue';
// 导航与布局
import Breadcrumb from './components/navigation/Breadcrumb.vue';
import Menu from './components/navigation/Menu.vue';
import Anchor from './components/navigation/Anchor.vue';
import BackTop from './components/navigation/BackTop.vue';
import Affix from './components/navigation/Affix.vue';
import FloatButton from './components/navigation/FloatButton.vue';
import DatePicker from './components/navigation/DatePicker.vue';
import TimePicker from './components/navigation/TimePicker.vue';
import Calendar from './components/navigation/Calendar.vue';
import ColorPicker from './components/navigation/ColorPicker.vue';
import Transfer from './components/navigation/Transfer.vue';
import VirtualList from './components/navigation/VirtualList.vue';
import Layout from './components/navigation/Layout.vue';
import Grid from './components/navigation/Grid.vue';
import Space from './components/navigation/Space.vue';
// 其他
import Watermark from './components/extras/Watermark.vue';
import Tour from './components/extras/Tour.vue';
import QRCode from './components/extras/QRCode.vue';
import CodeCard from './components/extras/CodeCard.vue';

import { registerCell } from './components/data-display/cells';
import { registerField } from './components/form-controls/fields';

/** 组件导出名无前缀，按需导入后直接使用 */
export {
  Button,
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
  NotificationContainer,
  Loading,
  Menu,
  DatePicker,
  TimePicker,
  Upload,
  Chat,
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
/** 单元格竞选：注册自定义单元格渲染器（同名替换内建实现） */
export { registerCell };
export type { CellRenderer, CellColumn } from './components/data-display/cells';
/** 字段竞选：注册自定义控件渲染器（同名替换内建实现） */
export { registerField };
export type { FieldRenderer, FormFieldMeta, FieldContext } from './components/form-controls/fields';

/** 全量注册映射：组件 → C 前缀 PascalCase 注册名（模板中使用 <c-button> 等） */
const registry: Record<string, unknown> = {
  CButton: Button,
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
  CNotificationContainer: NotificationContainer,
  CLoading: Loading,
  CMenu: Menu,
  CDatePicker: DatePicker,
  CTimePicker: TimePicker,
  CUpload: Upload,
  CChat: Chat,
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

/** 全量安装入口：app.use(Cumquat) 后以 <c-xxx> 标签名使用全部组件 */
export const Cumquat = {
  install(app: App) {
    for (const [name, component] of Object.entries(registry)) {
      app.component(name, component as never);
    }
  },
};

/** 统一数据请求机制的类型（实现见 @cumquat/composables） */
export type {
  Fetch,
  FetchQuery,
  FetchPagination,
  FetchSorter,
  FetchResult,
  PagedResult,
  UseFetchReturn,
} from '@cumquat/composables';

export default Cumquat;
