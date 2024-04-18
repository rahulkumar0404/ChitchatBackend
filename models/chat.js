import mongoose, { Schema, Types, model } from 'mongoose';

const chatSchema = new Schema(
  {
    group_name: {
      type: String,
      required: true,
    },
    group_chat: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

export const Chat = mongoose.models.Chat || model('Chat', chatSchema);
