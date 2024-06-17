import mongoose, { Schema, model } from 'mongoose';
import { hash } from 'bcrypt';
const userSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
    },
    bio: {
      type: String,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  return (this.password = await hash(this.password, 10));
});

userSchema.virtual('fullName').get(function () {
  return this.first_name + ' ' + this.last_name;
});

export const User = mongoose.models.User || model('User', userSchema);
