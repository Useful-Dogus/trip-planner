import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Lodging {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  date?: string | null;

  @Field(() => String, { nullable: true })
  endDate?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => Float, { nullable: true })
  lat?: number | null;

  @Field(() => Float, { nullable: true })
  lng?: number | null;

  @Field(() => String, { nullable: true })
  memo?: string | null;
}
