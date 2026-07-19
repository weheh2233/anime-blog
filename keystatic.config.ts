import { config, collection, fields } from '@keystatic/core';

const ZONES = [
  { label: '学习', value: '学习' },
  { label: '编程', value: '编程' },
  { label: '生活', value: '生活' },
  { label: '运动', value: '运动' },
  { label: '娱乐', value: '娱乐' },
  { label: '社交', value: '社交' },
];

export default config({
  storage: {
    kind: 'local',
  },

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
      },
    }),
  },
});
