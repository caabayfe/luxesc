// Generates src/fluent/chat/otto-skills.now.ts from src/fluent/chat/otto-skills.json: exposes each
// listed AI agent to Otto (the panel and Virtual Agent), the way AI Agent Studio does when a
// workflow is published to a channel. Per skill: a one-agent agentic workflow, its Now Assist
// skill (skill metadata, skill, skill config) and the skill's mapping to each Otto profile.
// Otto's orchestrator only chooses among page tools, catalog items, knowledge Q&A and mapped
// skills, never bare agents, and routes by the description, which is built from useWhen,
// examples, does and notFor so that neighbouring skills do not overlap. It also asks Otto to pass
// the message untranslated: Otto otherwise rewrites it in English and the agent answers in English.
// Agents are named by their Fluent key (Now.ID[...] of the AiAgent); their sys_ids come from
// src/fluent/generated/keys.ts, so an agent must have been built once before it is listed here.
// The skill config must name its skill by sys_id (a record reference there is dropped by the
// build), and a new skill only gets one in keys.ts once built: npm run otto:skills generates,
// builds and generates again, so new skills get their config on the second pass.
// Changing a skill's key replaces its workflow: the first install can fail to create the new one
// (same internal name as the old one, deleted later in that install), so install a second time.
// Usage: npm run otto:skills
import {readFileSync, writeFileSync} from 'node:fs';

const dir = new URL('../src/fluent/chat/', import.meta.url);
const {profiles, skills} = JSON.parse(readFileSync(new URL('otto-skills.json', dir), 'utf8'));
const keys = readFileSync(new URL('../src/fluent/generated/keys.ts', import.meta.url), 'utf8');

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function agentSysId(key) {
  const match = keys.match(new RegExp(`['"]?${escape(key)}['"]?:\\s*\\{\\s*table:\\s*'sn_aia_agent'\\s*id:\\s*'([0-9a-f]{32})'`));
  if (!match) throw new Error(`No built AI agent with key "${key}": define it in Fluent and build once first`);
  return match[1];
}

// The built sys_id of a skill: its metadata has a Now.ID key, the skill is keyed by that metadata
function skillSysId(skill) {
  const metadata = keys.match(new RegExp(`'luxesc-otto-${escape(skill.key)}-metadata':\\s*\\{\\s*table:\\s*'sn_aia_skill_metadata'\\s*id:\\s*'([0-9a-f]{32})'`));
  if (!metadata) return null;
  const built = keys.match(new RegExp(`table:\\s*'sys_gen_ai_skill'\\s*id:\\s*'([0-9a-f]{32})'\\s*key:\\s*\\{\\s*skill_document:\\s*'${metadata[1]}'`));
  return built ? built[1] : null;
}

function check() {
  const names = skills.map(skill => skill.name);
  skills.forEach(skill => {
    ['key', 'name', 'agent', 'agentName', 'useWhen', 'does', 'notFor', 'conversation'].forEach(field => {
      if (!String(skill[field] || '').trim()) throw new Error(`Skill "${skill.name || skill.key}" needs ${field}`);
    });
    if (!/^[a-z0-9-]+$/.test(skill.key)) throw new Error(`Skill key "${skill.key}" must be lowercase words joined by -`);
    if (!skill.examples?.length) throw new Error(`Skill "${skill.name}" needs examples`);
    // Otto tells skills apart by their descriptions; every quoted skill in notFor must exist
    for (const [, named] of skill.notFor.matchAll(/'([^']+)'/g)) {
      if (!names.includes(named)) throw new Error(`Skill "${skill.name}" refers to unknown skill '${named}'`);
    }
  });
  if (new Set(names).size !== names.length) throw new Error('Skill names must be unique');
  if (new Set(skills.map(skill => skill.key)).size !== skills.length) throw new Error('Skill keys must be unique');
}

const describe = skill =>
  `Use when ${skill.useWhen}. For example: ${skill.examples.map(example => `"${example}"`).join(', ')}. ${skill.does} Not for ${skill.notFor}. Pass the employee's message word for word, in the language they wrote it, so the agent answers in that language.`;

// An optional first step hands the message to another member of the team (added by another app,
// never named here) before the skill's own agent.
const plan = skill => {
  const steps = [
    `Use the '${skill.agentName}' agent with the employee's message word for word, in their language (never translated). Call it right away; do not ask for confirmation first.`,
    `Let the agent hold the conversation: ${skill.conversation}.`,
    'When the agent finishes, the task is complete: do not call it again or repeat its answer.',
    'Answer in the language the employee wrote in.',
  ];
  if (skill.first) steps.unshift(skill.first);
  return steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
};

const js = value => JSON.stringify(value);

const pending = [];

function config(skill, id) {
  const skillId = skillSysId(skill);
  if (!skillId) {
    pending.push(skill.name);
    return '';
  }
  return `Record({
    $id: Now.ID['${id}-config'],
    table: 'sys_gen_ai_skill_config',
    data: { skill_id: '${skillId}', hint: ${js(skill.name)}, active: true, visible: true, discoverable: true, use_knowledge_graph: false },
})

`;
}

function records(skill) {
  const id = `luxesc-otto-${skill.key}`;
  const description = describe(skill);
  const workflow = `${skill.key.replace(/-(\w)/g, (_, c) => c.toUpperCase())}Workflow`;
  const mappings = Object.entries(profiles).map(
    ([profile, sysId]) => `Record({
    $id: Now.ID['${id}-profile-${profile}'],
    table: 'sys_cs_context_profile_skill',
    data: { context_profile: '${sysId}', skill_id: ${workflow}Skill },
})`
  );
  return `// ${skill.name} -> ${skill.agentName}
export const ${workflow} = AiAgenticWorkflow({
    $id: Now.ID['${id}-workflow'],
    name: ${js(skill.name)},
    description: ${js(description)},
    recordType: 'custom',
    executionMode: 'copilot',
    securityAcl: { $id: Now.ID['${id}-acl'], type: 'Any authenticated user' },
    dataAccess: { roleMap: ['snc_internal'] },
    team: { $id: Now.ID['${id}-team'], name: ${js(skill.name)}, members: ['${agentSysId(skill.agent)}'] },
    versions: [{ name: 'V1', number: 1, state: 'published', instructions: ${js(plan(skill))} }],
})

const ${workflow}Metadata = Record({
    $id: Now.ID['${id}-metadata'],
    table: 'sn_aia_skill_metadata',
    data: { name: ${js(skill.name)}, description: ${js(description)}, document_table: 'sn_aia_usecase', document_id: ${workflow} },
})

const ${workflow}Skill = Record({
    $id: Now.ID['${id}-skill'],
    table: 'sys_gen_ai_skill',
    data: {
        skill_name: ${js(skill.name)},
        skill_description: ${js(description)},
        skill_table: 'sn_aia_skill_metadata',
        skill_document: ${workflow}Metadata,
        enable_followup: false,
    },
})

${config(skill, id)}${mappings.join('\n\n')}`;
}

check();
writeFileSync(
  new URL('otto-skills.now.ts', dir),
  `// Generated by scripts/generate-otto-skills.mjs from otto-skills.json; edit the JSON, not this file.
// After an install, Otto sees new or changed skills once the instance pushes its AI metadata
// (npm run otto:push, the daily "Push Metadata To Mosaic" job, or a save in AI Agent Studio).
import '@servicenow/sdk/global'
import { AiAgenticWorkflow, Record } from '@servicenow/sdk/core'

${skills.map(records).join('\n\n')}
`
);
console.log(`${skills.length} Otto skills written`);
if (pending.length) console.log(`Not built yet, so no skill config: ${pending.join(', ')}. Build, then run this again.`);
