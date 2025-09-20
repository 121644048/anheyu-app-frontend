<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type {
  SidebarPageSettingsInfo,
  JsonEditorTableColumn
} from "../../../type";
import JsonEditorTable from "../components/JsonEditorTable.vue";
import HighlightTagSelector from "../components/HighlightTagSelector.vue";

defineOptions({
  name: "SidebarPageForm"
});

const model = defineModel<SidebarPageSettingsInfo>({ required: true });

// 1. 创建 ref 用于“记忆”关闭开关前的数值
const lastValidPostCount = ref(0);
const lastValidWordCount = ref(0);

// 2. 使用 watch 监听 model 的初始加载，并存储初始有效值
watch(
  () => model.value,
  newModel => {
    // 如果初始值不是 -1，就将其存入我们的“记忆”变量中
    if (newModel.siteInfoTotalPostCount !== -1) {
      lastValidPostCount.value = newModel.siteInfoTotalPostCount;
    }
    if (newModel.siteInfoTotalWordCount !== -1) {
      lastValidWordCount.value = newModel.siteInfoTotalWordCount;
    }
  },
  { immediate: true }
);

const isTotalPostCountEnabled = computed({
  get() {
    return model.value.siteInfoTotalPostCount !== -1;
  },
  set(newValue: boolean) {
    if (newValue) {
      // 当开关打开时，恢复之前记住的数值
      model.value.siteInfoTotalPostCount = lastValidPostCount.value;
    } else {
      // 当开关关闭时，先记住当前的有效值，再设置为 -1
      if (model.value.siteInfoTotalPostCount !== -1) {
        lastValidPostCount.value = model.value.siteInfoTotalPostCount;
      }
      model.value.siteInfoTotalPostCount = -1;
    }
  }
});

const isTotalWordCountEnabled = computed({
  get() {
    return model.value.siteInfoTotalWordCount !== -1;
  },
  set(newValue: boolean) {
    if (newValue) {
      model.value.siteInfoTotalWordCount = lastValidWordCount.value;
    } else {
      if (model.value.siteInfoTotalWordCount !== -1) {
        lastValidWordCount.value = model.value.siteInfoTotalWordCount;
      }
      model.value.siteInfoTotalWordCount = -1;
    }
  }
});

const skillColumns = ref<JsonEditorTableColumn[]>([
  { prop: "name", label: "技能描述" }
]);

const skillsForTable = computed(() =>
  (model.value.authorSkills || []).map(skill => ({ name: skill }))
);

const updateSkills = (jsonString: string) => {
  try {
    const arrayData = JSON.parse(jsonString || "[]");
    const skills = arrayData.map((item: { name: string }) => item.name);

    // 确保至少有2项技能
    if (skills.length < 2) {
      console.warn("技能列表至少需要2项");
      return;
    }

    model.value.authorSkills = skills;
  } catch (e) {
    console.error("更新技能列表失败:", e);
  }
};

const socialColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "标题 (如: Github)" },
  { prop: "link", label: "链接" },
  { prop: "icon", label: "图标类名" }
]);

const socialsForTable = computed(() => {
  return Object.entries(model.value.authorSocial || {}).map(
    ([title, data]) => ({
      title,
      icon: data.icon,
      link: data.link
    })
  );
});

const updateSocials = (jsonString: string) => {
  try {
    const arrayData = JSON.parse(jsonString || "[]");
    const newObject: SidebarPageSettingsInfo["authorSocial"] = {};
    for (const item of arrayData) {
      if (item.title) {
        newObject[item.title] = {
          icon: item.icon,
          link: item.link
        };
      }
    }
    model.value.authorSocial = newObject;
  } catch (e) {
    console.error("更新社交链接失败:", e);
  }
};
</script>

<template>
  <div>
    <el-divider content-position="left">作者信息卡</el-divider>
    <el-form-item label="启用作者信息卡">
      <el-switch v-model="model.authorEnable" />
    </el-form-item>
    <el-form-item label="用户头像">
      <el-input
        v-model="model.userAvatar"
        placeholder="输入用户头像 URL"
        clearable
      />
    </el-form-item>
    <template v-if="model.authorEnable">
      <el-form-item label="状态图片 URL">
        <el-input
          v-model="model.authorStatusImg"
          placeholder="例如：https://..."
          clearable
        />
      </el-form-item>
      <el-form-item label="描述 (支持HTML)">
        <el-input
          v-model="model.authorDescription"
          type="textarea"
          :rows="3"
          placeholder="输入作者描述"
        />
      </el-form-item>

      <JsonEditorTable
        :model-value="JSON.stringify(skillsForTable)"
        title="技能列表"
        :columns="skillColumns"
        :new-item-template="{ name: '' }"
        :min-items="2"
        @update:model-value="updateSkills($event)"
      />

      <JsonEditorTable
        :model-value="JSON.stringify(socialsForTable)"
        title="社交链接列表"
        :columns="socialColumns"
        :new-item-template="{ title: '', link: '', icon: '' }"
        @update:model-value="updateSocials($event)"
      />
    </template>

    <el-divider content-position="left">微信二维码</el-divider>
    <el-form-item label="启用微信二维码">
      <el-switch v-model="model.wechatEnable" />
    </el-form-item>
    <template v-if="model.wechatEnable">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="正面二维码图片 URL">
            <el-input v-model="model.wechatFace" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="反面二维码图片 URL">
            <el-input v-model="model.wechatBackFace" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="微信模糊背景图片 URL">
            <el-input v-model="model.wechatBlurredBackground" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <el-divider content-position="left">标签</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="启用标签云">
          <el-switch v-model="model.tagsEnable" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">归档</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="归档显示的月份个数">
          <el-input-number v-model="model.archiveDisplayMonths" :min="0" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item v-if="model.tagsEnable" label="选择高亮的标签">
      <HighlightTagSelector v-model="model.tagsHighlight" />
    </el-form-item>

    <el-divider content-position="left">网站资讯</el-divider>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="启用文章总数">
          <el-switch v-model="isTotalPostCountEnabled" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="启用运行时长">
          <el-switch v-model="model.siteInfoRuntimeEnable" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="启用总字数">
          <el-switch v-model="isTotalWordCountEnabled" />
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped></style>
