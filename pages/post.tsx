import React from "react";
import { withRouter, WithRouterProps } from "next/router";
import Link from 'next/link';
import Page from "../components/Page";

import 'markdown-it-highlight/dist/index.css'

interface PostRenderingProps {
  title: string;
  bodyHtml: string;
}

const PostWrapper = (props: WithRouterProps) => {
  let pageJson: PostRenderingProps | null = null;
  if (props.router.query &&  props.router.query.fullUrl) {
    pageJson = require(`../content${props.router.query.fullUrl}.json`);
  }

  return (
    <div>
      <Page body={PostBody(pageJson as PostRenderingProps)} />
    </div>
  );
}

const PostBody = (props: { title: string, bodyHtml: string }) => {
  return (
    <div>
      <h1>Post: {props.title}</h1>
      <Link href="/posts"><a>Back to posts</a></Link>
      <div dangerouslySetInnerHTML={{ __html: props.bodyHtml }} />
    </div>
  );
}

export default withRouter(PostWrapper);
