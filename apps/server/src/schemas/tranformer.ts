const transform = (_doc: unknown, ret: Record<string, any>) => {
    const id = ret._id?.toString();

    const createdAt = ret.createdAt?.toISOString();
    const updatedAt = ret.updatedAt?.toISOString();
    const deletedAt = ret.deletedAt?.toISOString();
    if (ret.__v !== undefined) {
        ret.v = ret.__v;
        delete ret.__v;
    }
    if (id) {
        ret.id = id;
        delete ret._id;
    }
    if (createdAt) ret.createdAt = createdAt;
    if (updatedAt) ret.updatedAt = updatedAt;
    if (deletedAt) ret.deletedAt = deletedAt;

    return ret;
};

export default transform;
