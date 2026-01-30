import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReminderAttachments1769222600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('reminders', [
      new TableColumn({
        name: 'attachmentUrl',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'attachmentFilename',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'attachmentMime',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'attachmentSize',
        type: 'bigint',
        isNullable: true,
      }),
      new TableColumn({
        name: 'attachmentUploadedAt',
        type: 'timestamptz',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('reminders', 'attachmentUploadedAt');
    await queryRunner.dropColumn('reminders', 'attachmentSize');
    await queryRunner.dropColumn('reminders', 'attachmentMime');
    await queryRunner.dropColumn('reminders', 'attachmentFilename');
    await queryRunner.dropColumn('reminders', 'attachmentUrl');
  }
}
