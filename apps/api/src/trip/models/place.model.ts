import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Place {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => Float, { nullable: true })
  lat?: number | null;

  @Field(() => Float, { nullable: true })
  lng?: number | null;
}
