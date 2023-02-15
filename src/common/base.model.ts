import {
    Column,
    CreatedAt,
    Model,
    UpdatedAt,
} from 'sequelize-typescript';

export class BaseModel extends Model {
    @CreatedAt
    @Column({ field: 'created_at' })
    public createdAt: Date;

    @UpdatedAt
    @Column({ field: 'updated_at' })
    public updatedAt: Date;
}
