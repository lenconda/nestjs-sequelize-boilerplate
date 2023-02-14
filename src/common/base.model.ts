import {
    Column,
    CreatedAt,
    DataType,
    Model,
    UpdatedAt,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

export class BaseModel extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: sequelize.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @CreatedAt
    @Column({ field: 'created_at' })
    public createdAt: Date;

    @UpdatedAt
    @Column({ field: 'updated_at' })
    public updatedAt: Date;
}
