import { Schema, model } from 'mongoose'

const sourceFileSchema = new Schema({ file_path: String, file_content: String }, { _id: false })

const workspaceSchema = new Schema({
  repository_name: { type: String, required: true },
  github_repository_url: String,
  state: { type: String, default: 'draft' },
  source_file_count: { type: Number, default: 0 },
  source_files: [sourceFileSchema],
  guide: Schema.Types.Mixed,
}, { timestamps: true })

export const Workspace = model('Workspace', workspaceSchema)
