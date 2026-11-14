/**
 * 组件注册表：无前缀 PascalCase 名 → 组件定义。
 *
 * 供 LiveDemo 在运行时模板中解析 <Button> 等标签使用。
 *
 * 注意：新增组件时除 index.ts 外需同步维护本文件的导入与映射
 * （index.ts 保持 .vue 直接导入的结构，不从本模块 re-export）。
 */

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
import FloatButton from './components/other/FloatButton.vue';
import Tour from './components/other/Tour.vue';
import Watermark from './components/other/Watermark.vue';
// 文档工具
import CodeCard from './components/internal/CodeCard.vue';

/** 无前缀 PascalCase 名 → 组件定义（LiveDemo 运行时模板按此映射解析标签） */
export const components = {
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
  ChatInput,
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
  // List 三件套的点号访问形态：运行时模板中 <List.Item> 按字面量组件名解析
  'List.Item': ListItem,
  'List.Item.Meta': ListItemMeta,
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
  VoiceButton,
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
