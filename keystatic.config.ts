import { config, collection, singleton, fields } from '@keystatic/core';
import { SITE } from './src/consts';

const ZONES = [
  { label: '学习', value: '学习' },
  { label: '编程', value: '编程' },
  { label: '生活', value: '生活' },
  { label: '运动', value: '运动' },
  { label: '娱乐', value: '娱乐' },
  { label: '社交', value: '社交' },
];

export default config({
  storage: process.env.NODE_ENV === 'production'
    ? {
        kind: 'github',
        repo: {
          owner: 'weheh2233',
          name: 'anime-blog',
        },
      }
    : { kind: 'local' },

  collections: {
    posts: collection({
      label: '博客文章',
      path: 'src/content/posts/*',
      slugField: 'title',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: {
            label: '标题',
            validation: { isRequired: true },
          },
        }),
        description: fields.text({
          label: '描述',
          validation: { isRequired: true },
          multiline: true,
        }),
        author: fields.text({
          label: '作者',
          defaultValue: SITE.author,
          validation: { isRequired: true },
        }),
        publishDate: fields.date({
          label: '发布日期',
          validation: { isRequired: true },
        }),
        zone: fields.select({
          label: '专区',
          options: ZONES,
          defaultValue: '编程',
        }),
        tags: fields.array(
          fields.text({ label: '标签' }),
          {
            label: '标签',
            itemLabel: (props) => props.value || '新标签',
          }
        ),
        heroImage: fields.image({
          label: '封面图',
          directory: 'public/images',
          publicPath: '/images/',
        }),
        draft: fields.checkbox({
          label: '草稿',
          defaultValue: false,
        }),
        content: fields.markdoc({
          label: '正文',
          formatting: {
            inlineCode: true,
            bold: true,
            italic: true,
            strikethrough: true,
          },
          links: true,
          dividers: true,
          tables: true,
          images: {
            directory: 'public/images',
            publicPath: '/images/',
          },
        }),
      },
    }),
    music: collection({
      label: '音乐管理',
      path: 'src/content/music/*',
      slugField: 'title',
      format: 'yaml',
      columns: ['title', 'artists', 'enabled', 'order'],
      schema: {
        title: fields.slug({
          name: {
            label: '歌名',
            validation: { isRequired: true },
          },
        }),
        artists: fields.array(
          fields.text({ label: '歌手' }),
          {
            label: '歌手',
            itemLabel: (props) => props.value || '新歌手',
          }
        ),
        album: fields.text({
          label: '专辑',
          defaultValue: '',
        }),
        audio: fields.text({
          label: '音乐文件路径',
          description: '请先将 MP3 手动放入 public/music/，然后填写以 /music/ 开头的网站访问路径。',
          validation: { isRequired: true },
        }),
        cover: fields.image({
          label: '封面图',
          directory: 'public/images/music/',
          publicPath: '/images/music/',
        }),
        duration: fields.number({
          label: '时长（秒）',
          defaultValue: 0,
          validation: { min: 0 },
        }),
        order: fields.number({
          label: '排序',
          defaultValue: 0,
        }),
        enabled: fields.checkbox({
          label: '启用',
          defaultValue: true,
        }),
      },
    }),
  },

  singletons: {
    siteSettings: singleton({
      label: '站点设置',
      path: 'src/content/site/',
      schema: {
        backgroundImages: fields.array(
          fields.image({
            label: '背景图',
            directory: 'public/images/site/',
            publicPath: '/images/site/',
          }),
          {
            label: '自定义背景图',
            description: '可上传多张，每次刷新首页随机显示（与默认背景图一起轮换）',
            itemLabel: (props) => props.value?.filename || '新背景图',
          }
        ),
        memoryRecords: fields.array(
          fields.object({
            title: fields.text({
              label: '记录标题',
              validation: { isRequired: true },
            }),
            startDate: fields.date({
              label: '相遇日期',
              validation: { isRequired: true },
            }),
            content: fields.text({
              label: '记录短句',
              multiline: true,
            }),
          }),
          {
            label: '相遇记录',
            description: '首页小卡片展示的相遇/事件记录，会按相遇日期自动计算经过天数。',
            itemLabel: (props) => props.value?.title || '新的相遇记录',
          }
        ),
      },
    }),
  },
});
