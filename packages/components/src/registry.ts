/**
 * 组件注册表：无前缀 PascalCase 名 → 组件定义。
 *
 * 供 LiveDemo 在运行时模板中解析 <Button> 等标签使用。
 *
 * 注意：新增组件时除 index.ts 外需同步维护本文件的导入与映射
 * （index.ts 保持 .vue 直接导入的结构，不从本模块 re-export）。
 */

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
import VoiceButton from './components/form-controls/VoiceButton.vue';
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
import List from './components/data-display/List.vue';
import ListItem from './components/data-display/ListItem.vue';
import ListItemMeta from './components/data-display/ListItemMeta.vue';
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
