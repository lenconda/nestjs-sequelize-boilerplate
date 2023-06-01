import {
    Column,
    CreatedAt,
    Model,
    UpdatedAt,
} from 'sequelize-typescript';

export class BaseModel<T = any> extends Model<T> {
    @CreatedAt
    @Column({ field: 'created_at' })
    public createdAt: Date;

    @UpdatedAt
    @Column({ field: 'updated_at' })
    public updatedAt: Date;
}
